# インデックス／レンジ演算子（^, ..）でスマートに配列操作

C# 8.0（.NET Core 3.0）以降では、`^`（インデックス演算子）と `..`（レンジ演算子）が使えるようになりました。

一見マイナーに見えますが、**末尾からのアクセスやスライス処理をシンプルに書ける便利な構文**です。
今回はこの2つの演算子について、実務での活用シーンを交えながら紹介します。


## `^`：末尾から要素を取得するインデックス演算子

配列の「最後の要素」が欲しいとき、つい `array[array.Length - 1]` と書いていませんか？

`^` を使えば、もっとシンプルに書けます。

```csharp
var array = new[] { "A", "B", "C", "D" };

Console.WriteLine(array[^1]); // "D"
Console.WriteLine(array[^2]); // "C"
```

> **ポイント**
> - `^1` は「末尾から1番目」、つまり最後の要素
> - `^2` は「末尾から2番目」

配列の長さを意識せず、末尾から相対的にアクセスできるのが大きな魅力です。

### 実務での活用例

この演算子は特にテキスト処理や配列処理で真価を発揮します。

```csharp
// ログファイルの最後の10行だけ取得する
var lastLines = File.ReadAllLines(logPath)[^10..];

// CSVデータの最終行（合計値など）だけを処理
var totalsRow = csvRows[^1];

// パスから拡張子を除いたファイル名だけ取得
string path = @"C:\Projects\Report.pdf";
string[] segments = path.Split('\\');
string filename = segments[^1].Split('.')[0]; // "Report"
```

## `..`：スライスを簡潔に記述できるレンジ演算子

「配列の一部だけ使いたい」と思ったとき、`for` 文や `Array.Copy` を使っていませんか？

`..` を使えば、指定した範囲のスライスが1行で書けます。

```csharp
var array = new[] { "A", "B", "C", "D", "E" };

var slice = array[1..4];

foreach (var item in slice)
{
    Console.WriteLine(item); // "B", "C", "D"
}
```

### よく使うパターン

- `array[..3]` → 先頭からインデックス2まで（"A", "B", "C"）
- `array[2..]` → インデックス2から末尾まで（"C", "D", "E"）
- `array[^3..^1]` → 末尾から3番目〜末尾から2番目（"C", "D"）
- `array[..]` → 配列全体のコピー（シャローコピー）

スライス対象が `Span<T>` や `ReadOnlySpan<T>` であれば、メモリコピーも発生しないため高パフォーマンスです。

### 実践的なユースケース

```csharp
// 文字列の先頭と末尾を除去（トリム的な処理）
string rawText = "【重要】会議は15時から開始します【周知】";
string trimmed = rawText[2..^3]; // "会議は15時から開始します"

// ページネーション処理
int pageSize = 10;
int pageNumber = 2; // 0-indexed
var pagedItems = allItems[(pageNumber * pageSize)..((pageNumber + 1) * pageSize)];

// 配列の先頭要素と残りの要素に分ける（分割代入的な使い方）
var first = array[0];
var rest = array[1..];
```

## パフォーマンス比較

従来の方法と比較した場合のパフォーマンスの違いを見てみましょう。

```csharp
// 従来の方法（1）：新しい配列にコピー
var traditionalSlice = new string[3];
Array.Copy(array, 1, traditionalSlice, 0, 3);

// 従来の方法（2）：LINQ
var linqSlice = array.Skip(1).Take(3).ToArray();

// レンジ演算子を使用
var rangeSlice = array[1..4];
```

ベンチマーク結果では、小さな配列の場合はほぼ同等ですが、大きな配列になると：

- レンジ演算子：最も高速（特にSpan<T>と組み合わせると効果的）
- Array.Copy：中程度
- LINQ：最も遅い（複数の中間コレクションが生成される）

## 構造体 `Index`／`Range` としての利用

これらの演算子は、`System.Index` や `System.Range` 構造体としても扱えます。

```csharp
Index last = ^1;
Range range = 1..^1;

var value = array[last];
var slice = array[range];
```

スライス範囲を動的に切り替えたいときなど、変数化しておくと扱いやすくなります。

```csharp
Range previewRange = isPreview ? 0..3 : 1..^1;
var previewItems = array[previewRange];
```

### メソッド定義での活用

引数としてインデックスやレンジを受け取るメソッドも定義できます：

```csharp
public T GetElement<T>(T[] array, Index index)
{
    return array[index];
}

public T[] GetSubset<T>(T[] array, Range range)
{
    return array[range];
}

// 使用例
var element = GetElement(array, ^1);
var subset = GetSubset(array, 1..^1);
```

## カスタムコレクションでの対応方法

自作のコレクションクラスでもインデックス/レンジ演算子を対応させるには、次のメソッドを実装します：

```csharp
public class MyCollection<T>
{
    private T[] _items;

    // インデックス演算子のサポート
    public T this[Index index] => _items[index];

    // レンジ演算子のサポート
    public T[] this[Range range] => _items[range];
}
```

## `List<T>` での使い方

先述の通り、`List<T>` は直接これらの演算子に対応していませんが、簡単な拡張メソッドで対応できます：

```csharp
public static class ListExtensions
{
    public static List<T> Slice<T>(this List<T> list, Range range)
    {
        var (start, length) = range.GetOffsetAndLength(list.Count);
        return list.GetRange(start, length);
    }
}

// 使用例
var list = new List<int> { 1, 2, 3, 4, 5 };
var slice = list.Slice(1..4); // [2, 3, 4]
```

## 注意点と対応バージョン

- 対象は **配列／`Span<T>`／`ReadOnlySpan<T>`**（`List<T>` は非対応）
- C# 8.0 以上＋.NET Core 3.0 以上が必要（.NET Framework は非対応）
- 範囲外を指定すると `IndexOutOfRangeException` になる点には注意
- 負のインデックスはサポートされていない（Pythonとは異なる）

### バージョン別対応状況

| フレームワーク         | C#バージョン | インデックス演算子(^) | レンジ演算子(..) | 備考                  |
|----------------------|------------|-------------------|---------------|---------------------|
| .NET Framework 4.8以下 | C# 7.3以下   | ✘ 非対応            | ✘ 非対応        | 完全非対応              |
| .NET Framework 4.8   | C# 8.0     | ✘ 非対応            | ✘ 非対応        | ランタイムサポートなし      |
| .NET Core 3.0        | C# 8.0     | ✓ 対応             | ✓ 対応         | フル対応                |
| .NET Core 3.1        | C# 8.0     | ✓ 対応             | ✓ 対応         | フル対応                |
| .NET 5               | C# 9.0     | ✓ 対応             | ✓ 対応         | フル対応                |
| .NET 6               | C# 10.0    | ✓ 対応             | ✓ 対応         | フル対応                |
| .NET 7/8            | C# 11.0/12.0 | ✓ 対応             | ✓ 対応         | フル対応・拡張機能あり     |
| .NET Standard 2.0以下 | -          | ✘ 非対応            | ✘ 非対応        | BCLのサポートなし         |
| .NET Standard 2.1    | -          | ✓ 対応             | ✓ 対応         | フル対応                |
| Xamarin (最新)        | C# 8.0+    | ✓ 対応             | ✓ 対応         | .NET Standard 2.1対応時 |
| Unity (最新)          | C# 8.0+    | ✓ 対応             | ✓ 対応         | .NET Standard 2.1対応時 |
| Mono (最新)           | C# 8.0+    | ✓ 対応             | ✓ 対応         | .NET Standard 2.1対応時 |

※ C#のバージョンとフレームワークのバージョンは独立していますが、演算子をサポートするには両方が対応している必要があります。プロジェクトファイル(.csproj)で`<LangVersion>8.0</LangVersion>`を指定しても、実行環境が.NET Framework 4.8のままであれば、これらの機能は利用できません。

### パフォーマンスの落とし穴

レンジ演算子は通常の配列に対して使用すると、新しい配列をメモリ上に作成します。頻繁に小さなスライスを作成するコードでは、GCの負荷が増大する可能性があります。

特にパフォーマンスが重要な場合は、`Span<T>`や`Memory<T>`と組み合わせて使いましょう：

```csharp
// 配列そのものではなく、参照だけを渡すためSpan<T>を使用
Span<int> numbers = new[] { 1, 2, 3, 4, 5 };
Span<int> slice = numbers[1..4]; // メモリコピーが発生しない
```

[Span<T> 構造体](https://learn.microsoft.com/ja-jp/dotnet/api/system.span-1?view=net-8.0)

## 実践例：テキスト処理の改善

テキスト処理は特にインデックス/レンジ演算子の恩恵を受けやすい領域です。

```csharp
// URLから不要な部分を削除
string url = "https://example.com/products?id=123";
string domain = url.Contains("://") 
    ? url[(url.IndexOf("://") + 3)..url.IndexOf("/", url.IndexOf("://") + 3)]
    : url[..url.IndexOf("/")];
// domain = "example.com"

// 文字列からタグを除去（簡易的な実装例）
string html = "<div>Hello <b>World</b>!</div>";
string content = html.Contains(">") && html.Contains("<")
    ? html[(html.IndexOf(">") + 1)..html.LastIndexOf("<")]
    : html;
// content = "Hello <b>World</b>"
```

## まとめ：モダンC#での配列操作の新常識

C# 8.0で導入されたインデックス演算子（`^`）とレンジ演算子（`..`）は、一見すると小さな機能追加ですが、日々のコーディングにおける多くの場面で威力を発揮します。

### 導入のメリット

- **コードの可読性向上**: `array[array.Length - 1]` よりも `array[^1]` の方が意図が伝わりやすい
- **バグのリスク低減**: インデックス計算のミスが減り、範囲外アクセスのリスクも軽減される
- **表現力の向上**: 特にテキスト処理やデータ処理において、より自然な表現ができる
- **よりコンパクトなコード**: 複雑なコレクション操作がワンライナーで書ける

### 使いどころのまとめ

| シナリオ | 従来の書き方 | 新しい書き方 |
|---------|------------|------------|
| 配列の最後の要素 | `array[array.Length - 1]` | `array[^1]` |
| 配列の最後から2番目 | `array[array.Length - 2]` | `array[^2]` |
| 先頭から3要素 | `array.Take(3).ToArray()` | `array[..3]` |
| 2番目以降全て | `array.Skip(2).ToArray()` | `array[2..]` |
| インデックス1から3まで | `array.Skip(1).Take(3).ToArray()` | `array[1..4]` |
| 末尾3つを除く | `array.Take(array.Length - 3).ToArray()` | `array[..^3]` |
| 配列のコピー | `array.ToArray()` | `array[..]` |

### パフォーマンスと組み合わせ技

- `Span<T>` との組み合わせで、メモリ効率の良いスライス処理が実現可能
- 従来のLINQでの複数メソッドチェーンよりも高速
- 大規模データセットでのスライス処理で特に効果的

### 導入時の注意点

- C# 8.0以上 + .NET Core 3.0以上が必要（.NET Framework非対応）
- List\<T\>等の一部コレクションでは拡張メソッドの実装が必要
- 配列操作ではメモリの新規確保が発生する点に注意（Span\<T\>推奨）
- 慣れるまでは「^1は最後の要素」という点を意識する

### 他の言語との比較

C#のインデックス/レンジ演算子は、Python、Ruby、Kotlinなど他の言語でも似た機能が提供されています。特にPythonユーザーであれば親しみやすいシンタックスでしょう。

```python
# Python
array = ["A", "B", "C", "D", "E"]
print(array[-1])    # "E" (Pythonは負のインデックスが使える)
print(array[1:4])   # ["B", "C", "D"]
```

```csharp
// C#
var array = new[] { "A", "B", "C", "D", "E" };
Console.WriteLine(array[^1]);  // "E"
Console.WriteLine(array[1..4]); // ["B", "C", "D"]
```

### 最後に

これらの演算子はC#のコードをよりモダンで洗練されたものにしてくれます。特に配列やテキスト処理を多く扱うプロジェクトでは、コードベースが劇的に改善する可能性があります。

また、`Index`や`Range`構造体を理解し活用することで、より柔軟な実装パターンも可能になります。メソッドの引数や戻り値としてこれらの型を使用すれば、APIもより表現力豊かになるでしょう。

> 詳しくは [Microsoft Learn：Index 構造体](https://learn.microsoft.com/dotnet/api/system.index)、[Range 構造体](https://learn.microsoft.com/dotnet/api/system.range) をチェックしてみてください。

**次のリファクタリングでぜひ使ってみてください。意外と"戻れなくなる"心地よさがあります。**