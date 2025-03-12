---
title: "C# LINQ入門 - データ操作の基本構文"
emoji: "📝"
type: "tech"
topics:
  - "csharp"
  - "linq"
published: true
published_at: "2025-01-16 18:57"
---

LINQ（Language Integrated Query）は、C#でデータベースやコレクションを簡潔に操作できるツールです。本記事ではLINQの基本構文を具体例とともに紹介し、データ操作に役立つメソッドの使い方を解説します。

---

## LINQとは？

LINQは、C#や.NET環境で使用できる統合クエリ言語です。データベース（Entity Framework Coreを使用）、コレクション、XMLなど、さまざまなデータソースに対して同じ構文でクエリを記述できます。

### LINQを使うメリット
- **コードが簡潔になる**: 複雑なデータ操作を数行で記述可能。
- **統一された構文**: 複数のデータソースに対して一貫性のある書き方。
- **高い可読性**: SQLライクなスタイルでデータ操作が直感的に理解可能。

## 基本構文とメソッドの解説

以下にLINQの代表的なメソッドを紹介し、実際のデータ操作例を示します。

## 使用するデータおよびソース
https://github.com/ktnd111/Learning-Linq

環境セットアップなど、細かい手順は下記記事を参照してください。
https://zenn.dev/articles/e8d48dd2c7b88f/edit

### Where: 条件検索
指定した条件に一致するデータをフィルタリングします。

```csharp
var booksByOrwell = context.Books
    .Where(b => b.Author.Name == "George Orwell")
    .ToList();

foreach (var book in booksByOrwell)
{
    Console.WriteLine(book.Title);
}
```
結果:

```console
1984
Animal Farm
```

### OrderBy / OrderByDescending: 並べ替え
データを昇順または降順に並べ替えます。

```csharp
var sortedBooks = context.Books
    .OrderBy(b => b.Title)
    .ToList();

foreach (var book in sortedBooks)
{
    Console.WriteLine(book.Title);
}
```
結果:
```console
1984
Animal Farm
Clean Code
```
### Select: 必要な列の抽出
データの一部を取得する際に使用します。

```csharp
var bookTitles = context.Books
    .Select(b => b.Title)
    .ToList();

foreach (var title in bookTitles)
{
    Console.WriteLine(title);
}
```
結果:
```console
1984
Animal Farm
Clean Code
```
### Count: データ件数の取得
指定した条件のデータ件数を取得します。

```csharp
var count = context.Books
    .Count(b => b.Author.Name == "George Orwell");

Console.WriteLine($"George Orwell's books: {count}");
```
結果:
```console
George Orwell's books: 2
```
### GroupBy: データのグループ化
データを特定のキーでグループ化します。

```csharp
var booksGroupedByAuthor = context.Books
    .GroupBy(b => b.Author.Name)
    .Select(group => new
    {
        Author = group.Key,
        BookCount = group.Count()
    });

foreach (var group in booksGroupedByAuthor)
{
    Console.WriteLine($"{group.Author}: {group.BookCount} books");
}
```
結果:

```console
George Orwell: 2 books
Robert C. Martin: 1 book
```
## 実践例: 複数のメソッドを組み合わせる
以下は、条件検索・並べ替え・グループ化を組み合わせた実践例です。

```csharp
var sortedAuthorsWithBookCount = context.Authors
    .Select(a => new
    {
        Author = a.Name,
        BookCount = a.Books.Count
    })
    .OrderByDescending(a => a.BookCount)
    .ToList();

foreach (var author in sortedAuthorsWithBookCount)
{
    Console.WriteLine($"{author.Author}: {author.BookCount} books");
}
```
結果:
```console
George Orwell: 2 books
Robert C. Martin: 1 book
```
## まとめ
本記事では、LINQを使ったデータ操作の基本構文を紹介しました。以下のメソッドについて解説しました：

条件検索: Where
並べ替え: OrderBy / OrderByDescending
必要な列の抽出: Select
集計: Count
グループ化: GroupBy

LINQは、データベースやコレクションを扱う際に非常に便利なツールです。実際のプロジェクトや業務で活用するために、この記事の内容をぜひ参考にしてください！ 