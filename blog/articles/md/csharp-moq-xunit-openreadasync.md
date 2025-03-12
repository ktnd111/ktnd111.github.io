---
title: "[Moq & xUnit] BlobClient.OpenReadAsyncをモック化する方法"
emoji: "👏"
type: "tech"
topics:
  - "csharp"
  - "xunit"
published: true
published_at: "2025-02-21 20:14"
---

Azure Storage Blobsのクライアント（BlobClientやBlobBaseClientなど）を使用したコードの単体テストで、OpenReadAsyncメソッドが呼ばれる箇所で返すストリームをモック化したいケースがあります。

しかし`Mock<BlobClient>().Setup(x => x.OpenReadAsync()).ReturnsAsync(...)`と単純に記述しても、戻り値がnullになってしまったりセットアップがマッチしなかったりする問題が発生することがあります。

この記事では、MoqとxUnitを使ってOpenReadAsyncをモック化する際の重要なポイントを解説します。

## デフォルト引数を含めたシグネチャの確認

OpenReadAsyncのシグネチャは呼び出し側から見ると引数なしに見えますが、コンパイラがデフォルト引数を補完しています。

実際には以下のように4つの引数を持つメソッドとして定義されています。

```csharp
public virtual Task<Stream> OpenReadAsync(
    long position = 0,
    int? bufferSize = null,
    BlobRequestConditions conditions = null,
    CancellationToken cancellationToken = default
);
```

呼び出しコードで`OpenReadAsync()`と記述していても、内部的には`OpenReadAsync(0, null, null, default)`のように4つの引数が渡されています。

Moqで戻り値の設定をする際は、この実際のシグネチャに合わせた設定が必要になります。

## 実装手順

### 1. テスト用ダミーストリームの作成

まずはテストコードでモックが返すダミーストリームを`MemoryStream`などで作成します。

```csharp
// テスト用ダミーストリームの作成
var dummyStream = new MemoryStream();
using (var writer = new StreamWriter(dummyStream, leaveOpen: true))
{
    writer.Write("Dummy data for testing");
    writer.Flush();
}
// StreamReaderなどで読み取れるように先頭に戻す
dummyStream.Position = 0;
```

補足※: `leaveOpen: true` はストリームを開きっぱなしにするオプションです。Writerが破棄されてもStreamを閉じずにおいておくことで、後続の読み込みでエラーを回避します。

### 2. Moqでのセットアップ

OpenReadAsync の実際のシグネチャに合わせてモックを設定します。

```csharp
var blobClientMock = new Mock<BlobClient>();
blobClientMock
    .Setup(b => b.OpenReadAsync(
        It.IsAny<long>(),
        It.IsAny<int?>(),
        It.IsAny<BlobRequestConditions>(),
        It.IsAny<CancellationToken>()))
    .ReturnsAsync(dummyStream);
```

この設定により、テスト対象コードがOpenReadAsync()を引数なしで呼び出しても、デフォルト引数を含めて4つのパラメータがMoqのSetupにマッチし、ダミーストリームを返すことができます。

### 3. テスト対象コードへのモック注入

テスト対象クラスのコンストラクタやDI（依存性注入）を通じて、`blobClientMock.Object`を渡します。
ここで注意すべき点は以下の2つです。
- テスト対象で`new BlobClient(...)`と直接インスタンス化していないか
- 他のモックやFactoryが適切にモック化できているか

```csharp:sample
// テスト対象クラスにモックを注入
var target = new TestTarget(blobClientMock.Object);
var result = await target.ProcessBlobAsync();
```

## よくあるハマりポイント

### デフォルト引数を無視した引数なしのSetup

```csharp
// 例）これだと呼び出しにマッチしない可能性がある
blobClientMock
    .Setup(b => b.OpenReadAsync())
    .ReturnsAsync(dummyStream);
```

引数なしのメソッドシグネチャは定義されておらず、デフォルト引数付きの4つのパラメータを持つシグネチャのみが存在します。そのため、Moqは「引数4つあり」としてSetupを記述する必要があります。

### モックインスタンスが使用されていない

テスト対象内部で直接`new BlobClient(...)`を使用している場合、モックではなく実際のインスタンスが呼び出され、テスト時にnullが返るなどの問題が発生します。
```csharp
// 避けるべき実装
public class BadImplementation
{
    public async Task ProcessAsync()
    {
        var client = new BlobClient(...); // モック化できない
    }
}
```

```csharp
// 推奨される実装
public class GoodImplementation
{
    private readonly BlobClient _client;
    
    public GoodImplementation(BlobClient client)
    {
        _client = client;
    }
}
```
依存を切り離せば、必要なときに必要な状態の要素を注入できるようになります。
テストで動作を差し替えたい箇所は、コンストラクタインジェクションやFactoryメソッドのモックを通じてテスト側で用意したモックを渡すように構成することが重要です。

## シグネチャ確認のTips

Visual StudioやVS Codeでは、呼び出し箇所でF12キーを押すとそのメソッドの定義へ移動できます。Azure SDKや.NETのクラスも、F12でソースコードまたはメタデータを確認できます。

例として`DeleteIfExists`を確認すると以下のように表示されます。
![](https://storage.googleapis.com/zenn-user-upload/fa0d7becf199-20250221.png)
「本当に引数がないメソッドなのか、デフォルト引数があるだけなのか」を把握することで、Moqのセットアップを適切に記述することができます。


## まとめ

- OpenReadAsync()は引数なしで呼び出せますが、実際には4つのデフォルト引数を持つメソッドです
- Moqでマッチさせるには、実際のメソッドシグネチャを意識してIt.IsAny<>()や具体値をセットアップする必要があります
- シグネチャがズレていると、nullが返ってきたりマッチしなかったりします
- F12などでメソッド定義を確認し、正しいSetupを記述しましょう

これらのポイントを押さえることで、Azure Blob Storageのクライアント呼び出しをスムーズにモック化することができます。

## 参考
https://learn.microsoft.com/ja-jp/dotnet/api/azure.storage.blobs.specialized.blobbaseclient.openreadasync?view=azure-dotnet#azure-storage-blobs-specialized-blobbaseclient-openreadasync(azure-storage-blobs-models-blobopenreadoptions-system-threading-cancellationtoken)

---
**IT業界に、ITエンジニアに貢献する企業**
ONE WEDGEはServerlessシステム開発を中核技術としてWeb系システム開発、AWS/GCPを利用した業務システム・サービス開発、PWAを用いたモバイル開発、Alexaスキル開発など、元気と技術力を武器にお客様に真摯に向き合う価値創造企業です。
https://onewedge.co.jp/