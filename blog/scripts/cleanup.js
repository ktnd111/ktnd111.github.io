const fs = require('fs');
const path = require('path');

// 必要なディレクトリ構造
const requiredDirs = [
  'blog/articles/md',    // Markdownファイル用
  'blog/articles/html',  // 生成されたHTMLファイル用
  'blog/assets',         // アセットファイル用
  'blog/css',           // CSSファイル用
  'blog/js'             // JavaScriptファイル用
];

// ディレクトリを作成
function createDirectories() {
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// 既存のファイルを移動
function moveFiles() {
  // 記事の移動
  const articlesDir = path.join(__dirname, '..', 'articles');
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir);
    files.forEach(file => {
      if (file.endsWith('.md')) {
        const sourcePath = path.join(articlesDir, file);
        const targetPath = path.join(__dirname, '..', '..', 'blog/articles/md', file);
        fs.renameSync(sourcePath, targetPath);
        console.log(`Moved ${file} to md directory`);
      } else if (file.endsWith('.html')) {
        const sourcePath = path.join(articlesDir, file);
        const targetPath = path.join(__dirname, '..', '..', 'blog/articles/html', file);
        fs.renameSync(sourcePath, targetPath);
        console.log(`Moved ${file} to html directory`);
      }
    });
  }
}

// メイン処理
function cleanup() {
  createDirectories();
  moveFiles();
  console.log('Cleanup completed');
}

cleanup(); 