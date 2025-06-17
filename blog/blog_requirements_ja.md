### 各ブログ記事の現状

- すべてのブログ記事は **Markdown**（例: `blog/articles/md/csharp-aws-lambda-mocktesttool.md`）と、そこから生成された **HTML** の 2 種類のファイルとして存在している。  
- Markdown ファイルにはフロントマター（タイトル・日付・タグなどのメタデータ）が含まれている。  
- 生成済みの HTML ファイル内には `github-markdown.css` のようなローカル参照がハードコードされており、手動変換されたことが分かる。  
- 記事一覧 (`blog/articles.json`) は HTML ファイルを参照しているため、サイトは Markdown を動的に変換せず HTML を直接読み込んでいる。  

---

## 要件まとめ

### 単一の情報源 (Single source of truth)
- **Markdown を正規の編集元** とし、HTML を直接編集しない運用にする。  

### 自動変換 (Automated conversion)
- `blog/articles/md/` 配下の Markdown を、スクリプトや GitHub Actions などで自動的に `blog/articles/` 配下の対応する HTML へ変換する。  
- 生成された HTML では、CSS などのアセットを **正しい相対パス** で参照し、ローカル絶対パスを残さないようにする。  

### メタデータ処理 (Metadata handling)
- Markdown のフロントマターからタイトル・日付・タグなどを読み取り、HTML 生成時に反映させる。  
- 同じメタデータを用いて `blog/articles.json` を自動更新し、記事一覧の整合性を保つ。  

### Cursor との統合 (Cursor integration)
- Markdown に変更があるたびに変換スクリプトを自動実行するよう **Cursor の tasks/auto-run** を設定する。  
- 必要に応じて、pre-commit フックや CI（Cursor あるいは GitHub Actions）を設定し、公開前に HTML と記事一覧を必ず再生成する。  

### リポジトリ整理 (Repository cleanup)
- 「編集対象は Markdown、HTML は生成物」という方針をドキュメント化する。  
- 手動で HTML を編集する手順や習慣は廃止し、差異が生じないようにする。  

### テストとプレビュー (Testing and preview)
- 生成された HTML をコミット前にプレビューできるよう、Cursor のライブプレビューや統合環境を活用し、レイアウトやリンク切れを確認する。  

---

これらの要件を満たすことで **Markdown だけを編集すれば、Cursor が自動で HTML を生成し記事一覧も最新化** されるワークフローが実現します。
