const fs = require('fs');
const path = require('path');

// 必要なディレクトリを作成
const dirs = [
  'js',
  'css'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// highlight.jsのファイルをコピー
const highlightJsPath = path.join(__dirname, '../node_modules/highlight.js/lib/highlight.js');
const highlightJsDest = path.join(__dirname, '../js/highlight.min.js');

fs.copyFileSync(highlightJsPath, highlightJsDest);

console.log('Assets copied successfully!'); 