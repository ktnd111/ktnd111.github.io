# GitHub PagesとFirebaseで実装する無料アクセスカウンター完全ガイド

静的ウェブサイトでアクセスカウンターを実装したいと思ったことはありませんか？従来はサーバーサイドの処理が必要でしたが、Firebaseを活用すればGitHub Pagesのような完全に静的なサイトでも簡単にアクセスカウンターを実装できます。本記事ではその実装方法を詳しく解説します。

## 目次
1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [Firebase環境構築](#firebase環境構築)
3. [Firestore Databaseの設定](#firestore-databaseの設定)
4. [セキュリティルールの実装](#セキュリティルールの実装)
5. [HTMLとJavaScriptの実装](#htmlとjavascriptの実装)
6. [デプロイと動作確認](#デプロイと動作確認)
7. [発展的なトピック](#発展的なトピック)
8. [まとめ](#まとめ)

## アーキテクチャ概要

1. ユーザーがGitHub Pagesホストのウェブサイトにアクセス
2. ページのJavaScriptがFirebaseに接続
3. Firestoreのカウンターデータを取得・更新
4. 更新されたカウンターをページに表示

![アーキテクチャ図](../../../images/article/counter-architecture-diagram.svg)

このアーキテクチャの最大の特徴は、サーバーサイドの実装が一切不要なことです。すべての処理はクライアントサイドのJavaScriptとFirebaseによって行われます。

## Firebase環境構築
### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例：`my-access-counter`）
4. Google アナリティクスの設定（任意）
5. 「プロジェクトを作成」をクリック

### 2. Firebaseアプリの登録

1. プロジェクトのダッシュボードで「</>」（Webアプリ）をクリック
2. アプリのニックネームを入力（例：`github-pages-counter`）
3. 「アプリを登録」をクリック
4. Firebase SDKの追加方法が表示されます（これは後で使用します）
5. 「コンソールに進む」をクリック

この時点で表示されるFirebase設定情報（apiKey, authDomain, projectId等）をメモしておきましょう。
まとめてコピペしておくと便利です。

## Firestore Databaseの設定

次にカウンターデータを保存するFirestore Databaseを設定します。

### 1. Firestoreの有効化

1. Firebase Consoleの左側メニューから「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. セキュリティモードを選択（最初は「テストモード」でもOK、後でルールを設定します）
4. リージョンを選択（例：`asia-northeast1`（東京））
5. 「有効にする」をクリック

### 2. カウンターデータの初期化

1. 「コレクションを開始」をクリック
2. コレクションID「counters」を入力
3. ドキュメントIDに「visitors」を入力
4. フィールドに「count」（数値型）を追加し、値を「0」に設定
5. 「保存」をクリック

## セキュリティルールの実装

Firebaseのセキュリティは非常に重要です。適切なルールを設定して不正なアクセスやデータ操作を防ぎましょう。

### 1. Firestoreセキュリティルール

Firestoreのセキュリティルールは以下のように設定します。
- 誰でも読み取りは可能
- カウンターの更新は「count」フィールドのみ許可
- カウンターは必ず1ずつ増加するように制限

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /counters/visitors {
      allow read: if true;
      allow update: if request.resource.data.keys().hasOnly(["count"]) &&
                     resource.data.count is number &&
                     request.resource.data.count is number &&
                     request.resource.data.count == resource.data.count + 1;
      allow create: if request.resource.data.keys().hasOnly(["count"]) &&
                     request.resource.data.count is number &&
                     request.resource.data.count == 1;
    }
  }
}
```

Firebase Consoleの「Firestore Database」→「ルール」タブからこのルールを設定し、「公開」をクリックします。

### 2. API制限の設定

Firebase APIキーはHTMLに埋め込まれるため、誰でも見ることができます。そのため、不正使用を防ぐためにAPIキーの使用制限を設定します。

1. [Google Cloud Platform Console](https://console.cloud.google.com/)にアクセス
2. 左側メニューから「APIとサービス」→「認証情報」を選択
3. 「APIキー」をクリック
4. 「アプリケーションの制限」で「HTTPリファラー」を選択
5. GitHub Pagesのドメイン（例：`https://username.github.io/*`）を追加
6. 「保存」をクリック

この設定により、指定したドメインからのリクエストのみAPIキーが使用可能になります。

## HTMLとJavaScriptの実装

HTMLとJavaScriptを実装します。
コード量は少なめですのでHTML内に記述しても良いかなと思います。お好みでどうぞ。

### 1. HTMLの基本構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>アクセスカウンター</title>
  <style>
    .counter {
      font-family: monospace;
      font-size: 24px;
      background-color: #f5f5f5;
      padding: 8px 16px;
      border-radius: 4px;
      display: inline-block;
    }
  </style>
</head>
<body>
    <div class="container">
        <h1>アクセスカウンター</h1>
        <div id="counter">読み込み中...</div>
        <p>このページの総訪問者数</p>
    </div>
  
  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
  
  <!-- アクセスカウンタースクリプト -->
  <script src="counter.js"></script>
</body>
</html>
```

### 2. JavaScriptの実装 (counter.js)

```javascript
// Firebase設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const counterRef = db.collection('counters').doc('visitors');

// DOM要素の参照
const counterElement = document.getElementById('visitor-count');

// 初回訪問かどうかのチェック（セッションストレージを使用）
const sessionKey = 'visited';
const hasVisited = sessionStorage.getItem(sessionKey);

// カウンター処理
async function handleCounter() {
  try {
    // カウンターを表示
    const doc = await counterRef.get();
    if (doc.exists) {
      counterElement.textContent = doc.data().count.toLocaleString();
    } else {
      // ドキュメントが存在しない場合は作成
      await counterRef.set({ count: 1 });
      counterElement.textContent = '1';
    }
    
    // 初回訪問の場合はカウンターを増加
    if (!hasVisited) {
      // トランザクションを使用して安全に更新
      await db.runTransaction(async (transaction) => {
        const docRef = await transaction.get(counterRef);
        if (!docRef.exists) {
          transaction.set(counterRef, { count: 1 });
        } else {
          const newCount = docRef.data().count + 1;
          transaction.update(counterRef, { count: newCount });
        }
      });
      
      // 訪問済みとしてマーク
      sessionStorage.setItem(sessionKey, 'true');
      
      // 更新後のカウントを再取得して表示
      const updatedDoc = await counterRef.get();
      counterElement.textContent = updatedDoc.data().count.toLocaleString();
    }
  } catch (error) {
    console.error('カウンター処理エラー:', error);
    counterElement.textContent = 'Error';
  }
}

// カウンター処理を実行
handleCounter();
```

上記のJavaScriptコードでは以下の処理を行っています。

1. Firebaseを初期化
2. セッションストレージを使用して重複カウントを防止
3. トランザクションを使用して安全にカウンターを更新
4. エラーハンドリング

必ず`firebaseConfig`の値は、Firebase Consoleで取得した実際の値に置き換えてください。

## デプロイと動作確認

実装したファイルをGitHubリポジトリにプッシュして、GitHub Pagesでデプロイします。

### 1. GitHubリポジトリの作成

1. [GitHub](https://github.com/)にログイン
2. 「New repository」をクリック
3. リポジトリ名を入力（例：`access-counter-demo`）
4. 「Create repository」をクリック

### 2. ファイルのアップロード

1. リポジトリページで「Add file」→「Upload files」をクリック
2. 作成したHTMLとJavaScriptファイルをアップロード
3. 「Commit changes」をクリック

### 3. GitHub Pagesの有効化

1. リポジトリの「Settings」をクリック
2. 左側メニューから「Pages」を選択
3. 「Source」で「main」ブランチを選択
4. 「Save」をクリック

しばらく待つと、GitHub Pagesのサイトが有効になります（例：`https://username.github.io/access-counter-demo/`）

### 4. 動作確認

サイトにアクセスして、カウンターが表示され、更新されることを確認します。異なるブラウザやデバイスからアクセスして、カウンターが増加することを確認しましょう。

![動作確認の図](../../../images/article/counter-test.png)


## まとめ

Firebase Firestoreを使用することで、サーバーサイドの実装なしに、完全に静的なGitHub Pagesサイトにアクセスカウンター機能を簡単に追加できます。このアプローチの主なメリットは：

1. **サーバーレス**: サーバー管理が不要
2. **低コスト**: Firebaseの無料枠内で運用可能（1日あたり50,000回の読み取りと20,000回の書き込み、1GBのストレージまで無料）
3. **セキュリティ**: 適切なルールとAPIキー制限により保護
4. **拡張性**: さまざまな統計機能に発展可能

ただし、高トラフィックサイトの場合はFirebaseの無料枠を超える可能性があるため、料金プランを確認しておくことをお勧めします。

適切なセキュリティルールの設定と、API制限の設定を忘れないようにしましょう。これらの対策により、API情報が公開されていても、悪用される可能性を最小限に抑えることができます。

なお、本実装ではセッションストレージを使用して重複カウントを防止していますが、これはブラウザのセッションごとに計測される点に注意してください。つまり、ユーザーがブラウザを閉じて再度開くと、新たな訪問としてカウントされます。より厳密なユーザー識別が必要な場合は、LocalStorageやCookieを使用した実装に変更することも検討しましょう。

以上の手順に従えば、誰でも簡単に自分のウェブサイトにアクセスカウンターを実装できます。ぜひトライしてみてください！
