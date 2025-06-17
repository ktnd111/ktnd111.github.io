const fs = require('fs');
const path = require('path');

// 設定
const MD_DIR = path.join(__dirname, '../articles/md');

// カスタムブロックの変換
function convertCustomBlocks(content) {
  // 複数行のブロックを変換
  let converted = content.replace(/^:::(\w+)\n([\s\S]*?)\n:::/gm, (match, type, content) => {
    return `\`\`\`${type}\n${content}\n\`\`\``;
  });

  // 1行のブロックを変換
  converted = converted.replace(/:::(\w+)\s+([^:]+?)\s+:::/g, (match, type, content) => {
    return `\`\`\`${type}\n${content}\n\`\`\``;
  });

  return converted;
}

// メイン処理
function processMarkdownFiles() {
  const mdFiles = fs.readdirSync(MD_DIR).filter(file => file.endsWith('.md'));

  mdFiles.forEach(mdFile => {
    const mdPath = path.join(MD_DIR, mdFile);
    const content = fs.readFileSync(mdPath, 'utf8');
    const convertedContent = convertCustomBlocks(content);
    
    // 変換後の内容を保存
    fs.writeFileSync(mdPath, convertedContent);
    console.log(`Converted: ${mdFile}`);
  });
}

// 実行
processMarkdownFiles(); 