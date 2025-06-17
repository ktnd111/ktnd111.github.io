---
title: "C# LINQ入門 データベースからデータを取得する基本構文"
emoji: "🐷"
type: "tech"
topics:
  - "csharp"
  - "linq"
published: true
published_at: "2025-01-09 23:57"
---

LINQ（Language Integrated Query）は、C#でデータベースやコレクションを効率的に操作できる強力なツールです。このシリーズでは、LINQの基本から応用までを解説していきます。今回は、セットアップ済みのプロジェクトを使って、データベースからデータを取得する基本的なLINQ構文を紹介します。
## 事前準備（推奨開発環境）
この記事では以下の開発ツールを使用します。あらかじめインストールしておくことをお勧めします。
```details Visual Studio
C#のプロジェクト作成とコードの編集に **Visual Studio** を使用します。

### **必要なエディション**
- **Visual Studio 2022 Community Edition**（無料版）以上を推奨。

### **インストール手順**
1. [Visual Studio ダウンロードページ](https://visualstudio.microsoft.com/ja/downloads/) にアクセスします。
2. **Community Edition** を選択してインストーラーをダウンロード。
3. インストール中に「**ワークロード**」の設定画面が表示されます。
   - **.NET デスクトップ開発** を選択。
   - 必要に応じて **データベースツール** を含む「**データストレージと処理**」も選択。
4. インストールが完了したら、Visual Studio を起動します。

### **推奨設定**
- 必要に応じて、プロジェクト設定を日本語に設定してください。
```

```details SQL Server Management Studio (SSMS
データベースの管理とデータの確認に **SQL Server Management Studio (SSMS)** を使用します。

### **インストール手順**
1. [SSMS ダウンロードページ](https://learn.microsoft.com/ja-jp/sql/ssms/download-sql-server-management-studio-ssms) にアクセスします。
2. 最新バージョンのインストーラーをダウンロード。
3. インストーラーを実行し、指示に従ってインストールを完了させます。

### **接続手順**
1. SSMSを起動し、**オブジェクトエクスプローラー**で接続画面を開きます。
2. **サーバー名**を入力します：`(localdb)\MSSQLLocalDB`
3. 認証は「Windows 認証」を選択し、**接続**をクリック。
4. 正常に接続できると、ローカルデータベースが表示されます。
```

```details  Git
プロジェクトをGitHubで共有していますので、**Git** をインストールしておくと便利に使えます。

#### **インストール手順**
1. [Git公式サイト](https://git-scm.com/) にアクセス。
2. インストーラーをダウンロードし、指示に従ってインストール。
3. インストール後、コマンドラインで以下を実行し、インストールを確認します：
```bash
git --version
```
```
## 1. プロジェクト概要
セットアップされたC#プロジェクトを使用します。
このプロジェクトは、Entity Framework Core（EF Core）を使用してデータベースと接続しており、以下のような簡単なデータモデルを持っています。

### **データモデル**

#### **Author（著者）**

| カラム名     | 説明           | 属性      |
|--------------|----------------|-----------|
| `AuthorId`   | 著者ID         | 主キー     |
| `Name`       | 著者名         | -         |

---

#### **Book（書籍）**

| カラム名     | 説明           | 属性                |
|--------------|----------------|---------------------|
| `BookId`     | 書籍ID         | 主キー              |
| `Title`      | 書籍タイトル   | -                   |
| `AuthorId`   | 著者ID         | 外部キー（`Author`）|

## 2. 環境のセットアップ
プロジェクトをクローンして実行環境を準備します。

**リポジトリをクローン**
```bash
git clone https://github.com/ktnd111/Learning-Linq
cd Learning-Linq
```
**パッケージを復元**
```bash
dotnet restore
```
こちらからリポジトリページ飛んでもらっても構いません。
https://github.com/ktnd111/Learning-Linq

**データベースの準備**
プロジェクトをビルドして実行すると、データベースが自動的に生成されます。
動作確認 プロジェクトを実行し、データベース接続が成功していることを確認してください。

**データ準備**
ビルドし、デバッグを開始すると自動的にデータが挿入されます。

## 3. LINQでデータを取得する
以下は、データベースから著者とその関連書籍を取得する基本的なLINQ構文です。
下記コード（メソッド）は`Program.cs`からクラスインスタンスを生成し、実行してください。
（クローンしたままなら実行するだけでOKです）

著者と書籍の一覧を取得するコード
```csharp:Linq0.cs
using Learning_Linq.Data;
using Microsoft.EntityFrameworkCore;

namespace Learning_Linq.Learning;

public class Linq0
{
    public void LearningLinq0()
    {
        using (var context = new LibraryContext())
        {
            // データベースから著者とその書籍を取得
            var authorsWithBooks = context.Authors
                .Include(a => a.Books) // 著者に関連する書籍も取得
                .ToList();

            // 取得したデータをコンソールに表示
            foreach (var author in authorsWithBooks)
            {
                Console.WriteLine($"Author: {author.Name}");
                foreach (var book in author.Books)
                {
                    Console.WriteLine($"  Book: {book.Title}");
                }
            }
        }
    }
}
```
## 4. 実行結果
上記のコードを実行すると、以下のような結果が表示されます。

```yaml
Author: George Orwell
  Book: 1984
  Book: Animal Farm
Author: Robert C. Martin
  Book: Clean Code
Author: Andrew Hunt
  Book: The Pragmatic Programmer
Author: David Thomas
  Book: The Pragmatic Programmer
Author: Martin Fowler
  Book: Refactoring
Author: Eric Evans
  Book: Domain-Driven Design
Author: Kent Beck
  Book: Test-Driven Development: By Example
Author: Don Box
  Book: Essential COM
Author: Jeffrey Richter
  Book: CLR via C#
```
## 5. LINQ構文の解説
```csharp
var authorsWithBooks = context.Authors
    .Include(a => a.Books) // 著者に関連する書籍も取得
    .ToList();
```
今回使用したLINQ構文は上記のみです。
var authorsWithBooks = context.Authors
    .Include(a => a.Books)
    .ToList();

データベースから著者とその書籍を取得、Includeで著者に関連する書籍も取得します。
（関連する書籍（Books テーブル）を結合して取得します。）

クエリ結果をリストとして読み込んだものが`authorsWithBooks`です。

## 6. このコードで学べること
LINQを使ったデータベース操作の基本的な流れ。
データベースのリレーション（親子関係）を活用したクエリ。


LINQを使ったデータベース操作は、コードが簡潔で読みやすくなる非常に便利なスキルです。このシリーズを通じて、LINQを楽しく学んでいきましょう！😊