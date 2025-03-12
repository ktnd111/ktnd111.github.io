---
title: "C#プログラマーのためのPHP入門ガイド"
emoji: "📖"
type: "tech"
topics:
  - "php"
  - "cshap"
published: true
published_at: "2025-02-13 23:52"
---

このガイドはC#でのプログラミング経験がある方がPHPを学ぶための入門書です。C#との違いを中心に、PHPの基本的な概念と機能を説明していきます。

## 1. PHPの特徴

### C#との主な違い
PHPはWebアプリケーション開発に特化したスクリプト言語です。

- スクリプト言語であり、コンパイル不要で実行可能
- リクエストベースの実行モデル（各リクエストで新しいプロセスを開始）
- 変数の型は動的と静的の両方をサポート（PHP 7.0以降）
- 名前空間の区切り文字は`\`（C#は`.`）
- ファイルの拡張子は`.php`
- Webサーバー上での動作が前提

### 基本的な構文と型システム
```php
<?php
declare(strict_types=1); // 厳密な型チェックを有効化

// 型宣言を使用したクラス定義（PHP 7.4以降）
class Person {
    private string $name;
    private int $age;
    
    public function __construct(string $name, int $age) {
        $this->name = $name;
        $this->age = $age;
    }
    
    public function getName(): string {
        return $this->name;
    }
    
    public function getAge(): int {
        return $this->age;
    }
}

// Nullableな型の使用
class User {
    private ?string $middleName; // null許容の文字列
    
    public function setMiddleName(?string $name): void {
        $this->middleName = $name;
    }
}
```

C#では`string?`と書きますが、PHPのでは`?string`になります。また、コンストラクタの宣言はクラス名で書かず、`__construct`のようですね。マジックメソッドと呼び、いくつか定義されています。（?string に関しては、厳密な型チェック機能をONにしていないと案外ザルらしいので注意です）

C#では`.`でプロパティにアクセスできますが、PHPでは`->`と書きます。C#に慣れ親しんでいると文字数が気になりますが、ここは言語の特徴ということで…ひと目でわかる良い判断要素と捉えておくぐらいで良いかなと思います。
`->`はプロパティへのアクセスのほかに、メソッド呼び出しにも使うためPHPでは頻出記号です。慣れるまでは大変かもしれませんが、IDE等の入力補完でいい感じにできれば最高です。

C#を使っていると大体がVisualStudioを使用していますが、コンパイルエラーのおかげで型エラーはすぐに見つかりますが、PHPはランタイムエラーなので特性にも注意が必要そうです。とはいえ、IDEに備わっている機能である程度は静的解析が可能とのこと。

MEMO:
- 動的型と静的型の共存
    - C#では常に静的型付けですが、PHPではstrict_typesを有効にしてもなお動的型部分が混在します。ユニットテストや静的解析ツールを併用すると、エラーを早めに発見しやすくなります。

- 名前空間の区切り文字
    - C#は.を使いますが、PHPは\を使います。上記のように namespace MyApp\Models; と書き、そこにクラスを定義することが可能です。C#と同様 にプロジェクトをディレクトリで整理して名前空間と対応させると可読性が向上します。
- コンパイル不要の利点と注意点
    - PHPは即時実行できる反面、コンパイル時にエラーを検出できないため、ローカル環境で実際に動かして確認するフローが必須です。（一部IDEで補完可能）

## 2. メモリ管理とスコープ

### リクエストライフサイクル
PHPのメモリ管理はC#と大きく異なります。

1. リクエストスコープ
   - 各HTTPリクエストで新しいプロセスが開始
   - リクエスト終了時に自動的にメモリを解放
   - グローバル変数は各リクエストで初期化

2. 永続的な接続（Persistent Connections）
```php
// データベースの永続的な接続
$db = new PDO(
    "mysql:host=localhost;dbname=testdb",
    "username",
    "password",
    [PDO::ATTR_PERSISTENT => true]
);
```

3. セッション管理
```php
// セッションの開始
session_start();

// セッション変数の設定
$_SESSION['user_id'] = 123;

// セッションの破棄
session_destroy();
```

## 3. エラーハンドリング

### 例外処理の違い
PHPには`Error`と`Exception`の2種類のエラー型があります。

```php
try {
    // 通常の例外
    throw new Exception("一般的なエラー");
} catch (Exception $e) {
    // 例外処理
    error_log($e->getMessage());
} catch (Error $e) {
    // 致命的なエラー（PHPエンジンによるエラー）
    error_log("致命的なエラー: " . $e->getMessage());
} finally {
    // クリーンアップ処理
}
```

### カスタム例外
```php
class DatabaseException extends Exception {
    private $sqlState;
    
    public function __construct(string $message, string $sqlState = "") {
        parent::__construct($message);
        $this->sqlState = $sqlState;
    }
    
    public function getSqlState(): string {
        return $this->sqlState;
    }
}
```

MEMO:
- ExceptionとErrorの分離
    - C#では基本的にSystem.Exceptionクラスを継承する形で例外を扱います。一方、PHPはErrorとExceptionを分けているため、致命的エラーはcatch(Error $e)のように別途捕捉が必要になります。
- finallyブロックの存在
    - C#のtry-catch-finallyとほぼ同様に使えるため、リソース開放や後処理はfinallyに書くのが定石です。
- カスタム例外
    - ドメイン固有の例外を定義するという手法はC#と同じです。トラブルシューティングしやすいよう、独自のプロパティを持たせるなど工夫が可能です。

## 4. セキュリティ対策

### クロスサイトスクリプティング（XSS）対策
```php
// 出力時のエスケープ処理
$userInput = "<script>alert('XSS');</script>";
echo htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8');
```

### SQLインジェクション対策
```php
// プリペアドステートメントの使用
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $userId]);
```

MEMO:
- XSS対策
    - C#のRazorビューでも自動的にHTMLエスケープされますが、PHPの場合は明示的にhtmlspecialchars()やテンプレートエンジンのエスケープ機能を使う必要があります。
- SQLインジェクション対策
    - PDOのプリペアドステートメントは、C#のパラメータ化クエリと同様の仕組みです。必ずパラメータ化し、ユーザー入力を直接SQLに埋め込まないようにしましょう。
## 6. モダンPHPの開発プラクティス - PHPのパッケージ管理とPSR標準

### Composerによるパッケージ管理

PHPではパッケージ管理システムとして「Composer」が事実上の標準となっています。C#のNuGetに相当する仕組みで、ライブラリの依存関係を簡単に管理できるのが特徴です。

#### composer.jsonの設定

プロジェクトのルートディレクトリに配置する設定ファイルです。ここに必要なパッケージやPHPのバージョンなどを定義します。

```json
{
    "require": {
        "php": "^8.0",
        "monolog/monolog": "^2.0",
        "symfony/http-foundation": "^5.0"
    }
}
```

#### インストールとオートロード

Composerでは、以下の手順でライブラリを管理します。

1. `composer install` を実行すると、`vendor/` ディレクトリ配下に依存ライブラリがダウンロードされます。
2. 併せて `vendor/autoload.php` が生成され、これを require するだけでライブラリのクラスが自動的に使えるようになります。

### PSR標準とオートローディング (PSR-4)

PHPでは、複数のPSR(PHP Standards Recommendation)によって「コーディング規約」や「名前空間の扱い方」が定義されています。PSR-4はその中でも特に重要で、「クラスとファイルをどのように対応させるか」を定めたオートローディング規約です。

#### PSR-4の概要

名前空間とディレクトリ構造を 1:1 で対応させるルールを決め、require/include を手動で書かなくても クラスを呼び出すだけで自動読み込みできるようにする仕組みです。

例）
- クラス名: `App\Services\UserService`
- ファイルパス: `src/Services/UserService.php`

#### Composer設定

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    }
}
```

#### フォルダ構成例と名前空間

```
my-project/
├─ src/
│   ├─ Services/
│   │   └─ UserService.php
│   └─ Models/
│       └─ User.php
├─ composer.json
└─ index.php
```

UserService.phpの実装例

```php
<?php
namespace App\Services;

class UserService {
    public function __construct() {
        // ...
    }
}
```

`namespace App\Services;` と定義すると、`new \App\Services\UserService()` と書くだけで `src/Services/UserService.php` が自動的に読み込まれます。
この例では、composer.json の PSR-4 設定で App\\ を名前空間のプレフィックスとして指定していますが、これは単なる例示です。実際のプロジェクトでは、組織の構造やプロジェクトの性質を反映して、会社名（例：Acme\\）やプロジェクト名（例：MyProject\\）、あるいは機能領域（例：Core\\）をプレフィックスとして使用することが一般的です。この例では App\\ を使用することで、src ディレクトリ以下をアプリケーションのメイン領域として位置づけ、その意図を名前空間に反映させています。

#### Composerとの連携

1. `composer dump-autoload` を実行すると、`vendor/autoload.php` にオートロードの情報が登録されます。
2. PHPファイルの先頭などで `require 'vendor/autoload.php';` を呼び出しておけば、あとは `use App\Services\UserService;` のように宣言するだけでクラスが使えます。

### その他の重要なPSR標準

#### PSR-12 (コードスタイルガイド)

C#のスタイルコップに類似するガイドラインです。インデントや命名規則、ブレースの書き方などを定義しており、これに準拠することでチーム開発時のコードが統一されます。

#### PSR-3 (ロギング)

ロギングのインターフェイスを標準化した規格です。MonologなどのライブラリがPSR-3に準拠しているため、フレームワーク間で統一的な記法が使えます。ログレベルや実装方法が標準化されているため、異なるフレームワーク間でも一貫したロギング処理を実現できます。

MEMO:
- ComposerとNuGetの比較
    - C#のNuGetに相当する仕組みがComposerです。composer.jsonの設定に従い、composer install コマンドを実行すると必要なライブラリがダウンロード・管理されます。
- PSR-4とオートローディング
    - PHPではPSR-4規約を導入することで、ディレクトリ構造と名前空間が対応し、クラスを自動的に読み込めます。C#のプロジェクト構造と似たイメージで整理できるので、スッキリした構成を組みやすいです。
- コード規約 (PSR-12など)
    - C#のスタイルコップと同様、PHPにも推奨されるコーディング規約があります。チーム開発時はPSR-12やPSR-3(ロギング規約)などのガイドラインを活用してコードの統一性を保ちましょう。

## まとめ
PHPは、C#と比較して異なるパラダイムを持つ言語ですが、モダンなPHPは強力な型システムとクリーンなオブジェクト指向プログラミングをサポートしています。Webアプリケーション開発に特化した機能と、豊富なエコシステムを活用することで、セキュアで保守性の高いアプリケーションを開発することができます。

MEMO:
- 継続的に進化するPHP
    - PHPはバージョン7以降、型システムやパフォーマンス面で大幅な進化を遂げています。C#のように言語仕様がアップデートされ続けているため、積極的に追いかけていきましょう。
- 開発ツール
    - Visual Studioに慣れている場合、VS CodeやPhpStormなどPHP向けのIDEを使うことで補完やデバッグがしやすくなります。Xdebugという拡張を用いればブレークポイントを使ったステップ実行も可能です。
- フレームワークの活用
    - C#でASP.NET Coreを使うように、PHPではLaravelやSymfonyといったフレームワークを利用すると、認証やルーティングといった基本機能が整備され、より生産性高く開発できます。

## 参考リンク
- [PHP公式マニュアル](https://www.php.net/manual/ja/)
- [PHP-FIG（PHPフレームワーク相互運用グループ）](https://www.php-fig.org/)
- [PHP The Right Way](https://phptherightway.com/)
- [Laravel公式ドキュメント](https://laravel.com/docs)
- [Composer公式サイト](https://getcomposer.org/)
- [PHP Security Checklist](https://github.com/OWASP/CheatSheetSeries)
---
**IT業界に、ITエンジニアに貢献する企業**
ONE WEDGEはServerlessシステム開発を中核技術としてWeb系システム開発、AWS/GCPを利用した業務システム・サービス開発、PWAを用いたモバイル開発、Alexaスキル開発など、元気と技術力を武器にお客様に真摯に向き合う価値創造企業です。
https://onewedge.co.jp/