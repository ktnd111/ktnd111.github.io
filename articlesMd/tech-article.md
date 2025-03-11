# LINQの実行タイミングと変数未代入の落とし穴

システム開発において単体テストは通過したのに結合テストで初めて発見されるバグは珍しくありません。
今回は私が経験したコード実装における思わぬバグについて共有します。このケースはLINQの実行タイミングと変数の扱いに関する落とし穴に加え、テスト設計の重要性も浮き彫りにした事例です。

## バグの概要

システム改修の際に、コードの一部を修正した結果、予期せぬ問題が発生しました。単体テストでは問題なく通過したにもかかわらず、結合テストで初めてバグが発覚しました。

具体的には、DisplayRank（表示順位）が1〜3のデータだけを取得して処理するはずが、すべてのデータが処理されてしまうという問題でした。単体テストでは気づかなかったのですが、E2Eテストでは「1, 2, 2, 3」といった不正なデータ順序が検出され、大きな混乱を招きました。

## 問題のコード

問題となったコードは次のようなものでした。

```csharp
// DBからEntity Frameworkでデータを取得
var articles = GetArticles();

// 誤ったコード
articles.Where(a => a.DisplayRank >= 1 && a.DisplayRank <= 3).OrderBy(a => a.DisplayRank);
// その後の処理
foreach (var item in articles)
{
    // 処理内容
}
```

## 何が問題だったのか

上記のコードには2つの重大な問題があります。

1. **LINQ式の結果を変数に代入していない**
   LINQ式の結果が左辺の変数に代入されていないため、クエリは実行されますが結果は破棄されています。

2. **元のコレクションに対してループ処理**
   フィルタリングした結果ではなく、元の`news`コレクションに対して`foreach`ループを実行しているため、フィルタリングが無効になっています。

## 正しいコード

正しく実装すると次のようになります。

```csharp
// DBからEntity Frameworkでデータを取得
var articles = GetArticles();

// 正しいコード
var filteredArticles = articles.Where(a => a.DisplayRank >= 1 && a.DisplayRank <= 3)
                        .OrderBy(a => a.DisplayRank)
                        .ToList(); // 実行を確定させる
// フィルタリングされたコレクションに対して処理
foreach (var item in filteredArticles)
{
    // 処理内容
}
```

## なぜ単体テストで検出できなかったのか

単体テストでは、おそらく次のような理由で問題が検出できませんでした。

1. テストデータが少なく、フィルタリングの有無による違いが明確に現れなかった
2. テストケースが実際の利用シナリオを十分にカバーしていなかった
3. テスト環境と実環境でのデータ構造や量に違いがあった

## 教訓

このバグから学べる教訓は以下の通りです。

1. **LINQの遅延評価を理解する**
   LINQは実際に結果が必要になるまで評価を遅延させます。`ToList()`などのメソッドを呼び出すまでクエリは実行されません。

2. **変数への代入を確認する**
   特にLINQのような式の結果は、必ず変数に代入して使用するようにしましょう。

3. **コードレビューの重要性**
   些細なミスも複数の目で確認することで発見できる可能性が高まります。

4. **統合テストの設計**
   単体テストだけでなく、実際の利用シナリオに基づいた統合テストを設計することが重要です。

## 効果的なテスト設計の重要性

今回のバグは、単体テストでは検出できなかったものの、結合テストで発覚しました。この経験から、テスト設計の重要性について考えてみましょう。

### 単体テストの落とし穴

当初の単体テストでは、以下のようなアプローチを取っていました。

```csharp
[Fact]
public void FilterArticles_ReturnsCorrectData()
{
    // Arrange
    var articles = SetupTestArticles(); // DisplayRank 1,2,3の記事を用意
    var service = new ArticleService();
    
    // 挿入処理を実行
    service.InsertNewArticle(new Article { Title = "新記事", DisplayRank = 1 });
    
    // 既存のデータが変わっていることだけを確認していた
    // ただし、フィルタリングの結果を直接検証していなかった
}
```

このテストでは、「データが変わる」という事実は確認できましたが、「正しくフィルタリングされるか」という核心部分を検証していませんでした。

### より効果的なテスト設計

さまざまな実装がありますが、シンプルな実装を考えてみます。
動作としては、1→2→3→nullの順に表示ランクを調整しています。

```csharp
[Theory]
[InlineData(1)]
[InlineData(2)]
[InlineData(3)]
[InlineData(null)]
public void InsertArticle_ShiftsRanksCorrectly(int? newRank)
{
    // Arrange - DisplayRank 1,2,3の記事を用意
    var existingArticles = SetupTestArticles();
    var service = new ArticleService();
    
    // Act - 新しい記事を挿入
    service.InsertNewArticle(new Article { Title = "新記事", DisplayRank = newRank });
    
    // Assert - 期待値の設定
    int? expectedRank1, expectedRank2, expectedRank3;
    
    if (newRank == 1)
    {
        expectedRank1 = 2;
        expectedRank2 = 3;
        expectedRank3 = null;
    }
    else if (newRank == 2)
    {
        expectedRank1 = 1;
        expectedRank2 = 3;
        expectedRank3 = null;
    }
    else if (newRank == 3)
    {
        expectedRank1 = 1;
        expectedRank2 = 2;
        expectedRank3 = null;
    }
    else // newRank == null
    {
        expectedRank1 = 1;
        expectedRank2 = 2;
        expectedRank3 = 3;
    }
    
    // 各記事のランクを確認
    // ...
    
    // フィルタリングの結果も明示的に確認
    var filteredArticles = service.GetArticlesByRank(1, 3);
    Assert.Equal(3, filteredArticles.Count); // ランク1-3の記事が正確に3つあるべき
}
```

このアプローチの利点：

1. 複数のテストケースを効率的に実行できる
2. 各ケースの期待値を明示的に設定し、正確に検証できる
3. フィルタリングの結果そのものを検証している

## まとめ

一見単純なミスに思えますが、LINQの遅延評価の特性と相まって発見が難しいバグになりました。このような経験は、コードの書き方だけでなくテスト設計の重要性も教えてくれます。

特に重要なのは以下の点です：

1. LINQは変数に代入して利用する
2. フィルタリングの結果を明示的に検証するテストを書く
3. 複数のケースを網羅的にテストする（`Theory`と`InlineData`の活用）
4. データの変化だけでなく、処理の結果も検証する

普段気をつけていても起こりうるミスなので、複数の検証ステップを設けることが大切です。テストは「動作すること」だけでなく「正しく動作すること」を確認するものであることを忘れないようにしましょう。
