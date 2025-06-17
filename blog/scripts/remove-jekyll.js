const fs = require('fs');
const path = require('path');

// 削除対象のファイルとディレクトリ
const targets = [
  '_posts',
  '_site',
  '_layouts',
  '.jekyll-cache',
  '_config.yml',
  'Gemfile',
  'Gemfile.lock'
];

// メイン処理
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

// 実行
removeJekyllFiles(); 