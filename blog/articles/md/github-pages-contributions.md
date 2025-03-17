# GitHub Pagesサイトにコントリビューショングリッドを実装した話 🟩

## はじめに 👋

今回は私のGitHub Pagesサイトにコントリビューショングリッド（あの緑色のブロックマップ、通称「草」）を実装した経験を共有したいと思います。このプロジェクトでは、静的サイトの制約の中で動的なデータを扱うという挑戦に直面し、様々な技術的課題を乗り越えました。**「制約の中での創造性」** をテーマにして実装プロセスを振り返ります。

## プロジェクトの目標 🎯

- **学習モチベーションの向上** 📈: GitHub Pagesがあるので、自分のコントリビューション活動を可視化することで学習への意欲を高めたい
- **常時表示の利便性** 👁️: ヘッダーに実装することで、サイト内のどのページからでも活動記録を確認できるようにしたい
- **視覚的な彩り** 🎨: ダークカラーのヘッダー背景(#333)に緑色のコントリビューショングリッドを加えることで、サイトに視覚的な魅力を追加したい

結果として、140日分のコントリビューション履歴をヘッダーに表示することができ、殺風景なサイトに少し色がつきました。

## 実装アプローチの検討と課題 🤔

### 初期アプローチとその限界 ⚠️

まず最初に試したのは「GitHub APIを直接使ってコントリビューションデータを取得する方法」でした。しかし、この方法では2020年頃の古いデータしか取得できないという問題に直面し、結局狙ったものにはなりませんでした。

調査を進めた結果、GitHub GraphQL APIを使えば最新のコントリビューションデータが取得できることがわかりましたが、このAPIを使用するにはPersonal Access Token (PAT)が必要です。

あまりフロントエンドに明るくない当方ですが、 **静的サイト上にPATのような機密情報を埋め込むことはセキュリティ上かなりまずい** ということは分かります。なんとか静的サイトに実装する方法として考えたところ・・・

### 解決策の模索 💡

1. **Azure Functions活用** ☁️: 既存のF1プラン（無料枠）のAzure環境を使ってバックエンドサービスを構築
2. **GitHub Actions活用** 🤖: GitHub Actions内でAPI呼び出しを行い、結果をリポジトリに保存

最終的に選んだのは、Azure Functionsを使ったソリューションでした。具体的には以下2つのFunctionを実装しています。

- **GetGithubContributions** 📊: HTTPトリガーでGraphQL APIを呼び出すエンドポイント
- **UpdateGitHubContributions** ⏰: タイマートリガーで定期的にデータを更新し、リポジトリにコミット

## 技術的な実装と苦労した点 🛠️

### GraphQL初体験の苦労 📝

GitHub GraphQL APIは初で、クエリの書き方やデータ構造に戸惑いつつも少しずつ実装していきました。

```graphql
# GitHub GraphQLクエリ例
query {
  user(login: "ktnd111") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
```

### API経由のGitコミット 🔄

もう一つの挑戦は、API経由でGitリポジトリにコミットする方法を実装することでした。通常のFunctionの実装とは異なり、GitHub APIを使ってプログラム的にリポジトリを更新する仕組みを作る必要がありました。

```csharp
// Azure FunctionからGitHubリポジトリにファイルをコミットする例
var client = new GitHubClient(new ProductHeaderValue("UpdateContributions"));
client.Credentials = new Credentials(_config["GitHubToken"]);

// リポジトリ情報
var owner = "ktnd111";
var repo = "ktnd111.github.io";
var path = "data/contributions.json";

// 現在のファイル情報を取得（SHA値が必要）
var existingFile = await client.Repository.Content.GetAllContents(owner, repo, path);
var sha = existingFile.FirstOrDefault()?.Sha;

// ファイルを更新
var updateRequest = new UpdateFileRequest(
    message: "Update contributions data",
    content: Convert.ToBase64String(Encoding.UTF8.GetBytes(jsonContent)),
    sha: sha
);

await client.Repository.Content.UpdateFile(owner, repo, path, updateRequest);
```

### データフローの最適化 ⚡

コスト効率と性能を考慮し、次のようなデータフローを設計しました。

1. Azure Functionsで定期的にGraphQL APIからデータを取得 🔄
2. 取得したデータをJSONファイルとしてリポジトリに保存 💾
3. GitHub Pagesのヘッダーはこの静的JSONファイルを読み込む 📂

この方法により、ページ表示ごとにFunctionを実行することなく、常に最新のデータを表示できるようになりました。

表示ごとにAPIを叩いてしまうとF1プランとはいえ課金されてしまうため、1日1回のAPIコールになるよう意識して設計しました。（お試しで作成したBLOBなんかは放置してても1日10円ぐらいかかってますし、なるべくコストをかけずに。）

### コンポーネント読み込みの非同期問題 ⏳

実装過程で最も苦労したのは、ヘッダーをコンポーネントとして動的に読み込む際に発生した問題でした。サイトでは`loadComponent`メソッドを使ってヘッダーを読み込んでいましたが、このメソッドがヘッダー内のJavaScriptを自動的に実行してくれないことに気づきました。

解決策として、コンポーネント読み込み完了後に明示的に`github-contributions`メソッドを呼び出す実装に変更。

```javascript
// コンポーネントを読み込む関数
// 既存のloadComponent部分

document.addEventListener('componentsLoaded', () => {
    // header-component が読み込まれた後、明示的にコントリビューショングリッドを初期化
    if (typeof renderContributionGrid === 'function') {
        renderContributionGrid();
    } else {
        // github-contributions.js が読み込まれていない場合は読み込む
        const script = document.createElement('script');
        script.src = '/js/github-contributions.js';
        script.onload = function() {
            if (typeof renderContributionGrid === 'function') {
                renderContributionGrid();
            }
        };
        document.head.appendChild(script);
    }
});
```

### 開発・テストフローの制約 🧪

開発過程でもう一つ苦労したのは、GitHub Pagesに依存した実装のため、完全な動作検証が実際のデプロイ環境でしか行えない点でした。コミット→CI処理→デプロイ完了というサイクルを経なければ実際の動作が確認できず、開発効率が低下する場面もありました。

ここはまた今度開発用サーバーを立ち上げてなんとかしようと思っています。

## 学びと得られた知見 💭

このプロジェクトから得られた主な学びは以下の通りです：

1. **制約からの創造性** 💫: 「無料でやる」という制約が、むしろ創造的な解決策を生み出すきっかけになりました
2. **サーバーレスの活用** ☁️: Azure Functionsを活用することで、最小限のコストでバックエンド機能を実現できました
3. **GitHubエコシステムの理解** 🌐: GitHub ActionsやAPIなど、GitHubプラットフォームの機能をより深く理解できました
4. **フロントエンドとバックエンドの分離** 🧩: 静的サイトと動的データ取得の分離設計の重要性を実感しました

## 最終的な成果 🏆

最終的に完成したコントリビューショングリッドは、GitHub Pagesサイトのヘッダーに美しく組み込まれ、140日分の活動履歴を一目で確認できるようになりました。黒いヘッダー背景に緑色のグラデーションで表現されたアクティビティグリッドは、サイト全体に視覚的な彩りを加えています。

## まとめ 📝

静的サイトでの制約の中、動的なデータを表示するという挑戦は、多くの学びと創造的な解決策をもたらしました。「制限があるなかで色々試行錯誤する」というのが、エンジニアリングの本質の一つだと再認識できた貴重な経験となりました。

この実装が、同様の課題に取り組む方々の参考になれば幸いです。また、コントリビューショングリッドを目に見える場所に置くことで、GitHub活動のモチベーション向上にも確かに効果がありました。

---

最後までお読みいただき、ありがとうございました。何か質問や感想があれば、コメントやSNSでぜひ共有してください！ 👋
