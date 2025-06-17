---
title: "JekyllからGitHub Actionsへの移行：より柔軟なブログ運用の実現"
date: "2024-03-21"
tags: ["GitHub", "GitHub Actions", "Jekyll", "ブログ"]
category: "技術"
summary: "GitHub PagesのデフォルトビルドシステムであるJekyllから、より柔軟なGitHub Actionsベースのシステムへの移行手順を解説します。"
---

# JekyllからGitHub Actionsへの移行：より柔軟なブログ運用の実現

## はじめに

GitHub PagesはデフォルトでJekyllを使用してビルドを行いますが、より柔軟な運用を実現するために、GitHub Actionsを使用した独自のビルドシステムに移行しました。この記事では、その移行手順と実装の詳細を解説します。

## 移行の背景

### 現状の課題
- Jekyllの制約による柔軟性の欠如
- カスタムブロックの実装が複雑
- ビルドプロセスの透明性が低い

### 移行のメリット
- より柔軟なビルドプロセスの実現
- Node.jsベースの変換スクリプトによる拡張性の向上
- ビルドプロセスの完全な制御が可能

## 実装時の課題と解決策

### 1. Jekyllの自動ビルドの無効化

**課題**：
- `.nojekyll`ファイルの配置場所が適切でなかった
- GitHub Pagesの設定でJekyllの自動ビルドが有効なまま

**解決策**：
- ルートディレクトリに`.nojekyll`ファイルを配置
- GitHubリポジトリの設定で「Pages」のソースを「GitHub Actions」に変更

### 2. ディレクトリ構造の整理

**課題**：
- 既存のファイルの配置が散在していた
- アセットファイルの参照パスが正しくない

**解決策**：
- 新しいディレクトリ構造を設計
- `cleanup.js`スクリプトを作成して自動的にファイルを移動
- 相対パスを修正して、新しい構造に対応

### 3. GitHub Actionsの権限問題

**課題**：
```
remote: Permission to ktnd111/ktnd111.github.io.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/ktnd111/ktnd111.github.io.git/': The requested URL returned error: 403
```

**解決策**：
1. リポジトリの設定を変更：
   - Settings > Actions > General で「Workflow permissions」を「Read and write permissions」に設定
   - 「Allow GitHub Actions to create and approve pull requests」を有効化

2. ワークフローファイルに明示的な権限を追加：
```yaml
permissions:
  contents: write
  pages: write
  id-token: write
```

### 4. デプロイ先ブランチの設定

**課題**：
- デプロイ先のブランチ設定が適切でなかった
- `gh-pages`ブランチと`main`ブランチの混在

**解決策**：
- デプロイ先を`main`ブランチに統一
- ワークフローファイルの設定を更新：
```yaml
with:
  folder: blog/articles/html
  branch: main
```

## 移行手順

### 1. Jekyll関連ファイルの削除

まず、Jekyll関連のファイルとディレクトリを削除します：

```javascript
// remove-jekyll.js
const fs = require('fs');
const path = require('path');

const targets = [
  '_posts',
  '_site',
  '_layouts',
  '.jekyll-cache',
  '_config.yml',
  'Gemfile',
  'Gemfile.lock'
];

function removeJekyllFiles() {
  targets.forEach(target => {
    const targetPath = path.join(__dirname, '..', target);
    try {
      if (fs.existsSync(targetPath)) {
        if (fs.lstatSync(targetPath).isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
          console.log(`Removed directory: ${target}`);
        } else {
          fs.unlinkSync(targetPath);
          console.log(`Removed file: ${target}`);
        }
      }
    } catch (error) {
      console.error(`Error removing ${target}:`, error);
    }
  });
}

removeJekyllFiles();
```

### 2. ディレクトリ構造の整理

新しいディレクトリ構造を設定します：

```
/
├── blog/
│   ├── articles/
│   │   ├── md/      # Markdownファイル
│   │   └── html/    # 生成されたHTMLファイル
│   ├── assets/      # 画像などの静的ファイル
│   ├── css/         # スタイルシート
│   ├── js/          # JavaScriptファイル
│   └── scripts/     # 変換スクリプト
└── .github/
    └── workflows/   # GitHub Actions設定
```

### 3. GitHub Actionsワークフローの設定

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd blog
          npm install

      - name: Build
        run: |
          cd blog
          node scripts/convert_md_to_html.js

      - name: Deploy
        id: deployment
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: blog/articles/html
          branch: main
```

### 4. 必要な設定変更

1. リポジトリの設定で以下を確認：
   - Settings > Pages で Source を "GitHub Actions" に設定
   - Settings > Actions > General で適切な権限を設定

2. `.nojekyll`ファイルの配置：
   - ルートディレクトリに空の`.nojekyll`ファイルを作成

## 移行後の運用

### メリット
- Markdownファイルの編集のみで記事を更新可能
- カスタムブロックの実装が容易
- ビルドプロセスの完全な制御が可能
- より柔軟な拡張性

### 注意点
- GitHub Actionsの実行権限の適切な設定
- アセットファイルのパス設定
- ビルドプロセスの監視

## まとめ

JekyllからGitHub Actionsへの移行により、より柔軟で管理しやすいブログシステムを実現できました。この移行により、以下の点が改善されました：

- ビルドプロセスの透明性向上
- カスタマイズの自由度向上
- メンテナンス性の向上

実装時の課題を乗り越えることで、より堅牢なシステムを構築できました。特に以下の点が重要でした：

1. 適切な権限設定
2. 明確なディレクトリ構造
3. エラーハンドリングの実装
4. 段階的な移行プロセス

今後の改善点として、以下のような機能の追加を検討しています：

- プレビュー機能の強化
- 自動テストの導入
- パフォーマンスの最適化

## 参考リンク

- [GitHub Actions のドキュメント](https://docs.github.com/ja/actions)
- [GitHub Pages のドキュメント](https://docs.github.com/ja/pages)
- [JamesIves/github-pages-deploy-action](https://github.com/JamesIves/github-pages-deploy-action) 