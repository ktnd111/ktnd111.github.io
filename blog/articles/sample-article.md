# LINQの実行タイミングと変数未代入の落とし穴

こんにちは、今回はC#のLINQにおける遅延評価のパターンと、それによって生じる可能性のあるバグについて、実際に経験した事例をもとに解説します。

## 遅延評価とは？

LINQの大きな特徴の一つとして「遅延評価（Lazy Evaluation）」があります。これは、LINQのクエリが実際に**結果が必要になるまで実行されない**という性質です。

例えば、以下のようなコードがあります：

```csharp
// データソース定義
var numbers = new List<int> { 1, 2, 3, 4, 5 };

// クエリ定義
var evenNumbers = numbers.Where(n => n % 2 == 0);

// この時点ではまだフィルタリングは実行されていない

// クエリ実行
foreach (var num in evenNumbers)
{
    Console.WriteLine(num);  // ここでクエリが実行される
}
```

このコードでは、`Where`で偶数をフィルタリングするクエリを定義していますが、実際にフィルタリングが行われるのは`foreach`ループでイテレーションを開始したときです。

## 実際に遭遇したバグ

先日、以下のようなコードを書いていました：

```csharp
public IEnumerable<UserDto> GetActiveUsers()
{
    var query = _dbContext.Users.AsQueryable();
    
    // 条件に応じてクエリを構築
    if (ShouldFilterByRole)
    {
        string roleFilter = null;  // 後で値を設定するつもり
        
        // 設定忘れ！
        // roleFilter = GetUserRoleFilter();
        
        query = query.Where(u => u.Role == roleFilter);
    }
    
    // 常に有効なユーザーのみを返す
    query = query.Where(u => u.IsActive);
    
    return query.Select(u => new UserDto
    {
        Id = u.Id,
        Name = u.Name,
        Email = u.Email,
        Role = u.Role
    });
}
```

一見、問題ないように見えますが、`roleFilter`に値を設定し忘れています。通常なら、この変数が`null`のままであることでNULL参照の例外が発生するはずです。

しかし、テストを実行したところ、例外は発生せず、不思議なことに結果は常に空のリストでした。なぜでしょうか？

## 遅延評価が原因

これは、LINQの遅延評価が原因です。

1. `GetActiveUsers`メソッドでは、クエリを構築するだけで、実際には実行していません
2. 実際のクエリ実行は、戻り値の`IEnumerable<UserDto>`がイテレートされるときに行われます
3. その時点で、`roleFilter`は依然として`null`です
4. SQLクエリでは、`Role = null`の条件は、NULLの比較特性により常に偽となります
5. 結果として、どのレコードも条件に一致せず、空の結果が返されます

## 改善策

このような問題を回避するためには、以下のような対策が考えられます：

1. **変数の初期化チェック**：重要な変数が初期化されているかを明示的に確認する
2. **即時評価の使用**：必要に応じて`ToList()`や`ToArray()`などで即時評価を強制する
3. **コードレビュー**：このような落とし穴に気づけるよう、コードレビューを徹底する
4. **単体テスト**：様々なパターンをカバーする単体テストを作成する

## 実装例

改善したコードは以下のようになります：

```csharp
public List<UserDto> GetActiveUsers()  // IEnumerableではなくListを返す
{
    var query = _dbContext.Users.AsQueryable();
    
    // 条件に応じてクエリを構築
    if (ShouldFilterByRole)
    {
        string roleFilter = GetUserRoleFilter();  // 必ず初期化
        
        if (roleFilter == null)
        {
            throw new ArgumentNullException(nameof(roleFilter), "Role filter cannot be null");
        }
        
        query = query.Where(u => u.Role == roleFilter);
    }
    
    // 常に有効なユーザーのみを返す
    query = query.Where(u => u.IsActive);
    
    // ToListで即時評価を強制
    return query.Select(u => new UserDto
    {
        Id = u.Id,
        Name = u.Name,
        Email = u.Email,
        Role = u.Role
    }).ToList();
}
```

## まとめ

LINQの遅延評価は非常に強力な機能ですが、このように予期せぬ動作につながることもあります。特に、クエリ実行時点での変数の状態に依存するコードを書く場合は注意が必要です。

実際に経験してみると、C#とLINQの理解がより深まりますね。みなさんも同様のバグに遭遇したことはありますか？コメントで共有していただけると嬉しいです。

次回は、Entity Frameworkにおけるクエリの最適化についてお話しする予定です。お楽しみに！
