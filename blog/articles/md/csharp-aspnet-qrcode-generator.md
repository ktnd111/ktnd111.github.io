---
title: "[C# ASP.NET Core]QRコードジェネレーターを作成する"
emoji: "📘"
type: "tech"
topics:
  - "csharp"
  - "aspnet"
published: true
published_at: "2025-02-25 05:10"
---

ASP.NET Core Razorページを使用して、シンプルなQRコードジェネレーターを作成する方法を解説します。
このアプリケーションではユーザーが入力したテキストからQRコードを生成し、表示およびダウンロードすることができます。

demoページはこちら。（F1コールドスタートなので起動に時間がかかる場合があります）
https://testapps-1-f4ahh8bxazbgfnac.japanwest-01.azurewebsites.net/QrCodeGenerator

## 必要な環境
- .NET 8.0
- Visual Studio 2022
- QRCoder NuGetパッケージ

## 実装手順

### 1. NuGetパッケージのインストール
QRコード生成に必要な`QRCoder`パッケージをインストールします。
```powershell
dotnet add package QRCoder
```
もしくは、Nugetパッケージマネージャーからでも構いません。

### 2. Razorページの作成
QRコードジェネレーター用のページを作成します。ここではコードの重要な部分にフォーカスして説明します。

#### QrCodeGenerator.cshtml
```cshtml
@page
@model TestApp1Azure.Pages.QrCodeGeneratorModel
@{
    ViewData["Title"] = "QrCodeGenerator";
}
<style>
    .input-field {
        width: 300px;
        padding: 5px;
        margin-right: 10px;
    }
</style>

<h3>@ViewData["Title"]</h3>

<form method="post">
    <div>
        <label for="inputText">Text for QR Code:</label>
        <input type="text" asp-for="InputText" id="inputText" class="input-field" />
        <button type="submit">Generate</button>
    </div>
</form>

@if (!string.IsNullOrEmpty(Model.QrCodeImage))
{
    <div>
        <hr />
        <h4>Generated QR Code:</h4>
        <img src="@Model.QrCodeImage" alt="QR Code" style="width: 300px; height: 300px;" />
        <div class="mt-3">
            <form method="post" asp-page-handler="Download">
                <input type="hidden" asp-for="InputText" />
                <button type="submit" class="btn btn-primary">Download QR Code</button>
            </form>
        </div>
    </div>
}

```

#### QrCodeGenerator.cshtml.cs
```csharp
public class QrCodeGeneratorModel : PageModel
{
    [BindProperty]
    public string? InputText { get; set; }

    public string? QrCodeImage { get; set; }

    public void OnGet()
    {
        InputText = "";
    }

    public void OnPost()
    {
        if (!string.IsNullOrEmpty(InputText))
        {
            QrCodeImage = GenerateQRCode(InputText);
        }
    }

    public IActionResult OnPostDownload()
    {
        if (string.IsNullOrEmpty(InputText))
        {
            return RedirectToPage();
        }

        var qrCodeBytes = GenerateQRCodeBytes(InputText);
        return File(qrCodeBytes, "image/png", "qrcode.png");
    }

    private static string GenerateQRCode(string text)
    {
        var qrCodeBytes = GenerateQRCodeBytes(text);
        return $"data:image/png;base64,{Convert.ToBase64String(qrCodeBytes)}";
    }

    private static byte[] GenerateQRCodeBytes(string text)
    {
        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20);
    }
}
```

## コードのポイント解説

### ①ユーザー入力と表示
- シンプルなフォームで入力を受け付け、POSTメソッドでサーバーにデータを送信します。
- 条件付きレンダリング（`@if`）を使用して、QRコードが生成された場合のみ表示部分を表示します。

### ②QRコード生成の核心部分
```csharp
private static byte[] GenerateQRCodeBytes(string text)
{
    using var qrGenerator = new QRCodeGenerator();
    var qrCodeData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);
    using var qrCode = new PngByteQRCode(qrCodeData);
    return qrCode.GetGraphic(20);
}
```

このメソッドが実際にQRコードを生成する核心部分です。
- `QRCodeGenerator`インスタンスを作成し、入力テキストからQRコードデータを生成します。
- エラー訂正レベルは`ECCLevel.Q`（中程度）に設定しています。
- `PngByteQRCode`クラスを使用してPNG形式のQRコードを生成します。
- サイズパラメーター（20）はモジュールのピクセルサイズを指定します。

### ③Base64エンコードとUI表示
```csharp
private static string GenerateQRCode(string text)
{
    var qrCodeBytes = GenerateQRCodeBytes(text);
    return $"data:image/png;base64,{Convert.ToBase64String(qrCodeBytes)}";
}
```

- 生成したQRコードをBase64エンコードして、HTMLで直接表示できる形式に変換します。
- `data:image/png;base64,`プレフィックスを付けることで、ブラウザがこれを画像として認識します。

### ④ダウンロード機能
```csharp
public IActionResult OnPostDownload()
{
    if (string.IsNullOrEmpty(InputText))
    {
        return RedirectToPage();
    }

    var qrCodeBytes = GenerateQRCodeBytes(InputText);
    return File(qrCodeBytes, "image/png", "qrcode.png");
}
```

- ダウンロードボタンがクリックされると、このハンドラーが呼び出されます。
- `File()`メソッドを使用して、QRコードをPNGファイルとしてダウンロードできるようにします。
- 適切なMIMEタイプ（`image/png`）とファイル名（`qrcode.png`）を指定しています。

### ⑤コード設計のポイント
- QRコード生成ロジックを共通メソッドに分離し、表示とダウンロードの両方で再利用しています。
- `using`ステートメントでリソースの適切な解放を保証しています。
- フォームの入力値とプロパティの自動バインディングに`[BindProperty]`属性を活用しています。

## 参考資料

### QRCoder関連
- [QRCoder GitHub リポジトリ](https://github.com/codebude/QRCoder) - QRCoderライブラリの公式ソースコード
- [QRCoder NuGet パッケージ](https://www.nuget.org/packages/QRCoder/) - NuGet上のQRCoderパッケージ

### ASP.NET Core Razor Pages関連
- [ASP.NET Core Razor Pagesの概要](https://learn.microsoft.com/ja-jp/aspnet/core/razor-pages/) - Microsoftの公式ドキュメント
- [Razor構文リファレンス](https://learn.microsoft.com/ja-jp/aspnet/core/mvc/views/razor) - Razor構文の詳細な解説
- [ASP.NET Core でのページハンドラーメソッド](https://learn.microsoft.com/ja-jp/aspnet/core/razor-pages/handler-methods) - OnGet、OnPostなどのハンドラーメソッドの詳細

## まとめ
ASP.NET CoreとQRCoderパッケージを使用してシンプルながらも実用的なQRコードジェネレーターを簡単に実装しました。

QRCoderライブラリは豊富な機能を提供しており、今回の基本実装を拡張して、カラーQRコードや特殊なフォーマットへの対応も可能です。

---
**IT業界に、ITエンジニアに貢献する企業**
ONE WEDGEはServerlessシステム開発を中核技術としてWeb系システム開発、AWS/GCPを利用した業務システム・サービス開発、PWAを用いたモバイル開発、Alexaスキル開発など、元気と技術力を武器にお客様に真摯に向き合う価値創造企業です。
https://onewedge.co.jp/