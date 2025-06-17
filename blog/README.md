# ブログ

## 概要
このブログはMarkdownファイルをソースとして、HTMLファイルを自動生成する仕組みを採用しています。

## 開発環境のセットアップ

1. 依存関係のインストール
```bash
cd blog
npm install
```

2. Markdownファイルの編集
- 記事は `articles/md/` ディレクトリ内のMarkdownファイルとして作成します
- フロントマターに以下の情報を含めてください：
  ```yaml
  ---
  title: 記事のタイトル
  date: YYYY-MM-DD
  summary: 記事の概要
  tags: [タグ1, タグ2]
  category: カテゴリー
  background: 背景タイプ
  ---
  ```

3. 自動変換の実行
- 手動で変換する場合：
  ```bash
  npm run convert
  ```
- ファイルの変更を監視して自動変換する場合：
  ```bash
  npm run watch
  ```

## 運用ルール

1. 記事の編集は必ずMarkdownファイル（`articles/md/`）で行ってください
2. HTMLファイルは自動生成されるため、直接編集しないでください
3. 記事一覧（`articles.json`）も自動更新されます
4. GitHubにプッシュすると、GitHub Actionsが自動的に変換を実行します

## ディレクトリ構造

```
blog/
├── articles/
│   ├── md/          # Markdownファイル（編集対象）
│   └── *.html       # 生成されたHTMLファイル
├── scripts/
│   └── convert_md_to_html.js  # 変換スクリプト
├── package.json
└── articles.json    # 記事一覧
``` 