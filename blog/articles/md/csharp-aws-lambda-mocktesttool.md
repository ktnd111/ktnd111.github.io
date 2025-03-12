---
title: "C# AWS ALB⇔Lambda Mock Test Tool ローカル環境下でデバッグする"
emoji: "↔️"
type: "tech"
topics:
  - "aws"
  - "csharp"
  - "lambda"
  - "alb"
  - "visualstudio"
published: true
published_at: "2025-01-28 00:46"
---

AWSでサーバーレスアプリケーションを構築する際、Application Load Balancer（ALB）を使用してLambda関数にリクエストを送ることができます。
FT
応答経路はだいたいの場合Api Gatewayを選択することがほとんどですが、ALBとの連携も可能です。この記事ではALBとLambdaの応答をMock Test Toolでローカル環境下にてデバッグする方法を解説します。

## 実行環境
- VisualStudio 2022
- 拡張機能：AWS Toolkit with Amazon Q

### 拡張機能：AWS Toolkit with Amazon Q
![](https://storage.googleapis.com/zenn-user-upload/46d924a5d046-20250127.png)
インストールするだけでOKです。

### プロジェクト新規作成
AmazonQをインストールした後、新規プロジェクトを作成します。
![](https://storage.googleapis.com/zenn-user-upload/9adf59f74f5d-20250127.png)

新規プロジェクト名入力後のブループリント選択では「ALB」でフィルタリングするとすぐ見つけられます。
![](https://storage.googleapis.com/zenn-user-upload/98e6579bd5ec-20250127.png)

## 実装コード
下記リポジトリを使用します。
https://github.com/ktnd111/AWSLambda1

### Lambda関数の実装サンプル

リクエストを処理するLambda関数を実装します：

```csharp
using Amazon.Lambda.Core;
using Amazon.Lambda.ApplicationLoadBalancerEvents;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace AWSLambda1;

public class Function
{
    /// <summary>
    /// Application Load Balancerからのリクエストを処理するLambda関数
    /// </summary>
    /// <param name="request">ALBからのリクエスト情報</param>
    /// <param name="context">Lambda実行コンテキスト</param>
    /// <returns>ALBに返すレスポンス</returns>
    public ApplicationLoadBalancerResponse FunctionHandler(ApplicationLoadBalancerRequest request, ILambdaContext context)
    {
        // Lambdaのログストリームに情報を出力
        context.Logger.LogInformation($"Processing request: {request.Body}");

        try
        {
            // リクエストのパスとメソッドに基づいて処理を分岐
            var response = request.HttpMethod.ToUpper() switch
            {
                "GET" => HandleGetRequest(request),
                "POST" => HandlePostRequest(request),
                _ => CreateResponse(405, "Method not allowed")
            };

            return response;
        }
        catch (Exception ex)
        {
            // エラーが発生した場合は500エラーを返す
            context.Logger.LogError($"Error processing request: {ex.Message}");
            return CreateResponse(500, $"Internal server error: {ex.Message}");
        }
    }

    /// <summary>
    /// GETリクエストの処理
    /// </summary>
    private ApplicationLoadBalancerResponse HandleGetRequest(ApplicationLoadBalancerRequest request)
    {
        // パスに基づいて処理を分岐
        return request.Path switch
        {
            "/" => CreateResponse(200, "Welcome to ALB Lambda Demo"),
            "/health" => CreateResponse(200, "Healthy"),
            _ => CreateResponse(404, "Not found")
        };
    }

    /// <summary>
    /// POSTリクエストの処理
    /// </summary>
    private ApplicationLoadBalancerResponse HandlePostRequest(ApplicationLoadBalancerRequest request)
    {
        // リクエストボディをそのまま返すエコーサービス
        return CreateResponse(200, $"Received POST data: {request.Body}");
    }

    /// <summary>
    /// ALBレスポンスを生成するヘルパーメソッド
    /// </summary>
    private static ApplicationLoadBalancerResponse CreateResponse(int statusCode, string body)
    {
        return new ApplicationLoadBalancerResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" }
            },
            Body = body,
            IsBase64Encoded = false
        };
    }
}

```
### ざっくりコード説明
上から順にざっくりと説明します。

1. リクエストのボディをインフォメーションレベルでロギングします。
2. メソッドの種類でハンドルします。GET/POST以外は405（許可いないメソッド）で通過させ、エラー発生時はエラーレベルでロギングします。
3. GETリクエストを処理します。Pathの内容によって返答を分岐します。
4. POSTリクエストを処理します。受け取ったデータをそのまま返すだけの処理です。
5. レスポンスを作成するメソッド。返りの型は`ApplicationLoadBalancerResponse`で、最低限の要素を返しています。


`FunctionHandler`の引数にはALBからのリクエストが格納されています。`QueryStringParameters`や`Path`などrequest内にはALBが取り扱う情報があります。一方で`context`にはLambdaの情報が格納されています。

https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/csharp-context.html
https://docs.aws.amazon.com/ja_jp/elasticloadbalancing/latest/application/load-balancer-request-tracing.html

## Mock Test Toolでの動作確認
### Mock Lambda Test Tool起動
VisualStudioおなじみのデバッグ開始ボタンから起動します。正常にビルドできた場合、ブラウザが立ち上がります。
![](https://storage.googleapis.com/zenn-user-upload/c65c0f328026-20250127.png)

今回はリポジトリ同梱のコード（下記と同じ内容）を使用します。プリセットからALBリクエストを選んでもOKです。

実行するにはFunction Inputフィールドにデータを挿入し、Execute Functionボタンで実行します。

### GETリクエストのテスト

```json:request(get).json
{
  "requestContext": {
    "elb": {
      "targetGroupArn": "arn:aws:elasticloadbalancing:ap-northeast-1:123456789012:targetgroup/lambda-test/abcdef123456"
    }
  },
  "httpMethod": "GET",
  "path": "/health",
  "queryStringParameters": {
    "format": "json"
  },
  "headers": {
    "accept": "application/json",
    "host": "lambda-alb.example.com",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0",
    "x-forwarded-for": "192.168.1.1",
    "x-forwarded-port": "443",
    "x-forwarded-proto": "https"
  },
  "body": "",
  "isBase64Encoded": false
}
```

### POSTリクエストのテスト

```json:request(post).json
{
  "requestContext": {
    "elb": {
      "targetGroupArn": "arn:aws:elasticloadbalancing:ap-northeast-1:123456789012:targetgroup/lambda-test/abcdef123456"
    }
  },
  "httpMethod": "POST",
  "path": "/api/data",
  "queryStringParameters": null,
  "headers": {
    "accept": "application/json",
    "content-type": "application/json",
    "host": "lambda-alb.example.com",
    "user-agent": "PostmanRuntime/7.36.0",
    "x-forwarded-for": "192.168.1.1",
    "x-forwarded-port": "443",
    "x-forwarded-proto": "https"
  },
  "body": "{\"message\": \"Hello from ALB!\", \"timestamp\": \"2024-01-20T10:00:00Z\"}",
  "isBase64Encoded": false
}
```

### 期待される結果

1. GETリクエスト（/health）の場合：
```json
{
    "StatusCode": 200,
    "Headers": {
        "Content-Type": "application/json"
    },
    "Body": "Healthy",
    "IsBase64Encoded": false
}
```
Mock Test Tool上ではログも確認できます。
![](https://storage.googleapis.com/zenn-user-upload/7c6bb00f25b0-20250128.png)


2. POSTリクエストの場合：
```json
{
    "StatusCode": 200,
    "Headers": {
        "Content-Type": "application/json"
    },
    "Body": "Received POST data: {\"message\": \"Hello from ALB!\", \"timestamp\": \"2024-01-20T10:00:00Z\"}",
    "IsBase64Encoded": false
}
```
![](https://storage.googleapis.com/zenn-user-upload/fd254930f5fa-20250128.png)


### リクエストJSONを保存する
![](https://storage.googleapis.com/zenn-user-upload/68d392b83ace-20250128.png)

実行ボタンの右側「Save Request」ボタンを押下して保存すると下記のようなパスにリクエストを保存できます。
```
プロジェクトの場所\.lambda-test-tool\SavedRequests
```
ファイルで保存されますのでgitに入れておくのもありだと思います。

### 保存したリクエストJSONを呼び出す
![](https://storage.googleapis.com/zenn-user-upload/73a40eff2982-20250128.png)

前項で保存したリクエストJSONはプルダウンメニューから選択できます。

## まとめ

AWS Lambda Test Toolを使用することで、実際のALB環境がなくても、ローカルでLambda関数の動作を確認できます。Mock Test Toolでは普段のデバッグとほぼ同じような使用感でデバッグでき、VisualStudioを普段から使っている方なら馴染みやすい便利なツールだと思います。今回紹介したMock Test Toolの機能はほんの一部に過ぎませんが、API開発やLambdaの実装には欠かせないツールです。ぜひ試してみてください！

---
**IT業界に、ITエンジニアに貢献する企業**
ONE WEDGEはServerlessシステム開発を中核技術としてWeb系システム開発、AWS/GCPを利用した業務システム・サービス開発、PWAを用いたモバイル開発、Alexaスキル開発など、元気と技術力を武器にお客様に真摯に向き合う価値創造企業です。
https://onewedge.co.jp/