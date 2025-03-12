---
title: "Azure DevOps Pipelinesの無料枠を使うときの落とし穴と解決策"
emoji: "〰️"
type: "tech"
topics:
  - "azure"
  - "aspnetcore"
  - "azuredevops"
published: true
published_at: "2025-03-05 22:47"
---

「CI/CDパイプラインを導入したいな」と思い立ち、マイクロソフトが提供するAzure DevOpsのパイプラインを試してみることにしました。無料で使えるという触れ込みに誘われて、あまり深く考えずに「デフォルト設定でさくっと動かしてみよう」と安易に考えていた私を待っていたのは、思いがけない落とし穴でした。この記事では、Azure DevOps Pipelinesを使い始めようとした時にぶつかった壁と、その解決方法をお伝えしたいと思います。

## 問題1：並列実行権限がない！

ASP.NETプロジェクトのビルド自動化のために、マイクロソフトの公式ドキュメントに従ってパイプラインを設定しました。YAMLファイルも用意して「いざ実行！」と思ったその瞬間、以下のエラーメッセージが表示されました。

```
##[error]No hosted parallelism has been purchased or granted. To request a free parallelism grant, please fill out the following form https://aka.ms/azpipelines-parallelism-request
```

調べてみると、Azure DevOpsのパイプラインは確かに無料で使えるものの、Microsoftのホステッドエージェント（実行環境）を使うには「並列実行権限」が必要だということが分かりました。

**重要な変更点（2023年4月〜現在）**：2023年4月以降、Microsoftは無料アカウントへの並列実行権限の自動付与を停止し、申請制に変更しました。この方針は本記事執筆時点（2025年3月）でも継続しているので、最新情報は[公式ドキュメント](https://learn.microsoft.com/ja-jp/azure/devops/pipelines/licensing/concurrent-jobs)で確認してください。

## 問題2：セルフホストエージェント未設定

「申請が承認されるまで待つのはちょっと面倒だな」と思い、セルフホストエージェント（自分のマシンやサーバーで実行する方法）を試してみることにしました。YAMLファイルを以下のように変更しましたが・・・

```yaml
pool:
  name: Default  # セルフホストエージェントプール
```

でも、今度は別のエラーが出てきました。

```
##[error]No agent found in pool Default which satisfies the specified demands: msbuild, visualstudio, vstest, Agent.Version -gtVersion 2.163.1
```

「そういえば、エージェントのセットアップしてなかったな...」と気づいたところです。ASP.NETのビルドにはVisual Studioなど特定のツールが必要で、それらがインストールされたエージェントがなければ実行できません。

## 解決策：申請フォームの提出と承認

結局、最初のエラーメッセージに書かれていた申請フォーム（https://aka.ms/azpipelines-parallelism-request） に記入して無料使用枠を申請しておきました。

が、どうやらある程度の日数がかかるそうなので自前の環境に用意したほうが早いとの結論に至り・・・せっかくなのでセルフホストエージェントを作成しました。

## セルフホストエージェント

もしホステッドエージェントの申請を待ちたくない場合や、特殊な環境が必要な場合は、セルフホストエージェントを正しく設定する方法もあります。セルフホストエージェントは無料で利用できるため、並列実行枠の申請が不要です。

### Windows向けセルフホストエージェントのセットアップ手順（詳細版）

#### 1. 準備
- **必要なもの**
  - Azure DevOps組織へのアクセス権限
  - Personal Access Token (PAT)
  - エージェントをインストールするWindows PC/サーバー

- **PATの作成手順**
  1. Azure DevOpsのウェブサイト (https://dev.azure.com) にログイン
  2. 右上のユーザーアイコンをクリック → [Personal access tokens]
  ![](https://storage.googleapis.com/zenn-user-upload/45cd8e3d8ef8-20250305.png)
  4. [New Token] をクリック
  5. トークン名を入力（例えば "Self-hosted Agent Token"）
  6. 期間を設定（通常は30〜90日）
  7. スコープで "Agent Pools (read, manage)" を選択
  ![](https://storage.googleapis.com/zenn-user-upload/5acb1d6de492-20250305.png)
  8. [Create] をクリック
  9. 生成されたトークンをメモしておきましょう（このトークンは一度しか表示されないので注意してください）

#### 2. エージェントのダウンロードとインストール
1. Azure DevOpsのウェブサイトにログイン
2. 組織設定 → Agent pools へ移動
![](https://storage.googleapis.com/zenn-user-upload/b9b358ba3ebc-20250305.png)
![](https://storage.googleapis.com/zenn-user-upload/921d25b1707b-20250305.png)
3. [Default] プールを選択（または新しいプールを作成）
4. [New agent] をクリックしてWindows用のzipファイルをダウンロード
5. ダウンロードしたzipファイルを好きなフォルダに展開（例えば `C:\agent`）
6. 管理者権限でコマンドプロンプトを開き、展開したフォルダに移動します。`cd C:\agent`
7. 設定スクリプトを実行します。`config.cmd`
8. 以下の情報を入力してください。
   - サーバーURL：`https://dev.azure.com/あなたの組織名`
   - 認証タイプ：`PAT`
   - PAT：先ほど作成したトークン
   - エージェントプール：`Default`（または好きなプール名）
   - エージェント名：好きな名前（デフォルトはPC名）
   - 作業ディレクトリ：デフォルト（Enter）でOKです

なんやかんや設定すると・・・以下のように設定できたことが確認できます。
![](https://storage.googleapis.com/zenn-user-upload/6485a98105c6-20250305.png)

#### 3. エージェントの起動方法（2つの選択肢）

**オプション1：インタラクティブモード（テスト用）**
```
.\run.cmd
```
このモードはテストに便利ですが、コマンドウィンドウを閉じるとエージェントも終了してしまいます。
開発環境は普段使いのPCで、後述のようにサービス化しなくていいならこのままでOKです。自分はサービス化せず、使うときだけrunしようかなと思ってます。

**オプション2：Windowsサービスとしてインストール**
```
.\config.cmd --runAsService
```
または詳細オプション付きで。
```
.\config.cmd --unattended --url https://dev.azure.com/あなたの組織名 --auth pat --token あなたのPAT --pool Default --agent エージェント名 --runAsService
```

サービスとしてインストールするメリット
- PCを再起動しても自動的にエージェントが起動します
- ログインしていなくてもバックグラウンドで動作してくれます
- 手動で毎回起動する必要がなくて楽ちんです

デメリット
- PCのリソースを消費する
- 定期的にAzure等サービスと通信してしまう（モバイル環境などでの消費注意）

タスクスケジューラで実行させたり、専用マシンを使うなどすれば常時起動サービスでもいいかもしれません。自分の場合はそんなに頻繁に使用しないため、その都度実行する形で落ち着きました。

#### 4. 必要なツールのインストール
エージェントがセットアップされたマシンに、ビルドに必要なツールをインストールしましょう。
- ASP.NET Framework開発用：Visual Studio、MSBuild、VSTest
- ASP.NET Core開発用：.NET SDK
- その他プロジェクトに必要なツール

#### 5. YAMLファイルの修正
パイプラインのYAMLファイルを以下のように変更します。

```yaml
trigger:
- master  # または main

pool:
  name: Default  # セルフホストエージェントのプール名

variables:
  solution: '**/*.sln'
  buildPlatform: 'Any CPU'
  buildConfiguration: 'Release'

steps:
# 必要なタスク
- task: NuGetToolInstaller@1
# 以下省略...
```

正しくセットアップされたエージェントは、Azure DevOpsの組織ページの「Project Settings」→「Agent pools」で確認できます。エージェント名の横に緑色のステータスが表示されていれば、うまく動いています。
![](https://storage.googleapis.com/zenn-user-upload/6fc6d21cf055-20250305.png)
![](https://storage.googleapis.com/zenn-user-upload/7e6fc5b666f9-20250305.png)


## 学んだ教訓

1. **ドキュメントはじっくり読もう**
公式ドキュメントには無料利用の制限について書いてあったのですが、最初に読み飛ばしてしまったため混乱してしまいました。特に「料金」や「制限」に関する部分はしっかり確認するべしですね。

2. **パイプラインのホスト環境を理解しよう**
   - **Microsoftホステッドエージェント**：Microsoftが提供する実行環境です。無料枠は申請制になっています。最新のツール環境が整っていますが、並列実行に制限があります。
   - **セルフホストエージェント**：自前の環境です。セットアップは必要ですが無料枠の制限を受けません。自分好みの環境が作れます。

3. **適切なエージェント環境を選ぼう**
   - ASP.NET Frameworkなら`windows-latest`がいいでしょう
   - ASP.NET Coreなら`ubuntu-latest`が使えます（コストパフォーマンスがいいんです）
   - Dockerコンテナをビルドするなら`ubuntu-latest`が便利です

4. **運用前にテスト実行してみよう**
本格的な開発を始める前に、シンプルなパイプラインで実行が可能かテストしておくと、問題を早めに見つけられます。

## Azure DevOpsと他のCI/CDサービスの比較

Azure DevOps Pipelinesを選ぶ前に、他の主要なCI/CDサービスとの比較も見てみるといいかもしれません。

| サービス | 無料枠 | セットアップの容易さ | Microsoftサービスとの統合 | 特徴 |
|---------|--------|---------------------|--------------------------|------|
| **Azure DevOps Pipelines** | 1並列ジョブ（申請制） | やや複雑 | 優れている | YAML/GUIベースの柔軟な設定、包括的なDevOpsプラットフォーム |
| **GitHub Actions** | 2,000分/月 | 簡単 | 良好 | GitHubリポジトリとの緊密な統合、豊富なマーケットプレイスアクション |
| **GitLab CI/CD** | 400分/月 | 中程度 | 限定的 | GitLabリポジトリとの緊密な統合、多機能なDevOpsプラットフォーム |
| **CircleCI** | 6,000分/月 | 簡単 | 限定的 | 高速な実行、シンプルな設定 |

特にMicrosoft技術スタック（ASP.NET、Azureなど）を使用するプロジェクトでは、Azure DevOps PipelinesとGitHub Actionsが使いやすいと思います。GitHubリポジトリを使っているなら、設定が簡単でより多くの無料枠があるGitHub Actionsもいい選択肢かもしれませんね。
GithubIOで作ったページはActionsで自動的に実施されています。
https://ktnd111.github.io/

## まとめ

Azure DevOps Pipelinesは強力なCI/CDツールですが、無料で使い始めるには少しばかりの「お作法」があることが分かりました。申請手続きさえ済ませれば、個人開発や小さなチームには十分な無料枠が用意されています。

最終的に動作したパイプライン設定はこちらです。ほとんどデフォルトのままです。

```yaml
# ASP.NET
# Build and test ASP.NET projects.
# Add steps that publish symbols, save build artifacts, deploy, and more:
# https://docs.microsoft.com/azure/devops/pipelines/apps/aspnet/build-aspnet-4

trigger:
- master

pool:
  name: default

variables:
  solution: '**/*.sln'
  buildPlatform: 'Any CPU'
  buildConfiguration: 'Release'

steps:
- task: NuGetToolInstaller@1

- task: NuGetCommand@2
  inputs:
    restoreSolution: '$(solution)'

- task: VSBuild@1
  inputs:
    solution: '$(solution)'
    msbuildArgs: '/p:DeployOnBuild=true /p:WebPublishMethod=Package /p:PackageAsSingleFile=true /p:SkipInvalidConfigurations=true /p:PackageLocation="$(build.artifactStagingDirectory)"'
    platform: '$(buildPlatform)'
    configuration: '$(buildConfiguration)'

- task: VSTest@2
  inputs:
    platform: '$(buildPlatform)'
    configuration: '$(buildConfiguration)'

```

DevOpsの世界は奥が深いですが、最初のハードルを越えれば、開発の効率化にとても役立ってくれるはずです。みなさんも無料枠の申請をお忘れなく！そして、プロジェクトの要件に合わせていろいろなCI/CDサービスを比較してみてください。

---
**IT業界に、ITエンジニアに貢献する企業**
ONE WEDGEはServerlessシステム開発を中核技術としてWeb系システム開発、AWS/GCPを利用した業務システム・サービス開発、PWAを用いたモバイル開発、Alexaスキル開発など、元気と技術力を武器にお客様に真摯に向き合う価値創造企業です。
https://onewedge.co.jp/