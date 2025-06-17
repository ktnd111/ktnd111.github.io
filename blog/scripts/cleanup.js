const fs = require('fs');
const path = require('path');

// 設定
const HTML_DIR = path.join(__dirname, '../articles');
const MD_DIR = path.join(__dirname, '../articles/md');

// メイン処理
function cleanup() {
  // Markdownファイルの一覧を取得
  const mdFiles = fs.readdirSync(MD_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', '.html'));

  // HTMLファイルの一覧を取得
  const htmlFiles = fs.readdirSync(HTML_DIR)
    .filter(file => file.endsWith('.html'));

  // 不要なHTMLファイルを削除
  htmlFiles.forEach(htmlFile => {
    if (!mdFiles.includes(htmlFile)) {
      const filePath = path.join(HTML_DIR, htmlFile);
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${htmlFile}`);
    }
  });
}

// 実行
cleanup(); 