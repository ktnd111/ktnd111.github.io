const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const hljs = require('highlight.js');

// 設定
const MD_DIR = path.join(__dirname, '../articles/md');
const HTML_DIR = path.join(__dirname, '../articles');
const ARTICLES_JSON = path.join(__dirname, '../articles.json');

// カスタムブロックの処理
const customBlocks = {
  message: {
    class: 'message',
    title: 'メッセージ'
  },
  alert: {
    class: 'alert',
    title: '警告'
  },
  note: {
    class: 'note',
    title: '注意'
  }
};

// markedの設定
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

// カスタムブロックのレンダラー
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);

renderer.code = function(code, language) {
  // カスタムブロックの処理
  if (language && customBlocks[language]) {
    const block = customBlocks[language];
    return `
<div class="${block.class}">
  <div class="${block.class}-title">${block.title}</div>
  ${marked.parse(code)}
</div>`;
  }
  
  // 通常のコードブロックの処理
  return originalCodeRenderer(code, language);
};

marked.setOptions({ renderer });

// MarkdownをHTMLに変換
function convertMarkdownToHtml(mdContent, filePath) {
  const { data, content } = matter(mdContent);
  const html = marked.parse(content);
  
  // HTMLテンプレート
  const template = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <link rel="stylesheet" href="../css/github-markdown.css">
  <link rel="stylesheet" href="../css/highlight.css">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <article class="markdown-body">
    ${html}
  </article>
  <script src="../js/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>`;

  return {
    html: template,
    metadata: data
  };
}

// 記事一覧JSONを更新
function updateArticlesJson(metadata, htmlPath) {
  let articles = [];
  if (fs.existsSync(ARTICLES_JSON)) {
    articles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf8'));
  }

  const articleIndex = articles.findIndex(a => a.path === htmlPath);
  const articleData = {
    title: metadata.title,
    path: htmlPath,
    date: metadata.date,
    summary: metadata.summary,
    tags: metadata.tags,
    category: metadata.category,
    background: metadata.background
  };

  if (articleIndex >= 0) {
    articles[articleIndex] = articleData;
  } else {
    articles.push(articleData);
  }

  fs.writeFileSync(ARTICLES_JSON, JSON.stringify(articles, null, 2));
}

// メイン処理
function processMarkdownFiles() {
  const mdFiles = fs.readdirSync(MD_DIR).filter(file => file.endsWith('.md'));

  mdFiles.forEach(mdFile => {
    const mdPath = path.join(MD_DIR, mdFile);
    const htmlFile = mdFile.replace('.md', '.html');
    const htmlPath = path.join(HTML_DIR, htmlFile);

    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const { html, metadata } = convertMarkdownToHtml(mdContent, htmlPath);

    fs.writeFileSync(htmlPath, html);
    updateArticlesJson(metadata, `articles/${htmlFile}`);
  });
}

// 実行
processMarkdownFiles(); 