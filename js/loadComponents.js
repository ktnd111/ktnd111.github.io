// コンポーネントを読み込む関数
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component from ${componentPath}:`, error);
    }
}

// コンポーネントの読み込みを完了したことを通知するカスタムイベント
const componentsLoadedEvent = new CustomEvent('componentsLoaded');

// ページ読み込み時にコンポーネントを挿入
document.addEventListener('DOMContentLoaded', async () => {
    // 現在のパスに基づいて相対パスを調整
    const isInArticleFolder = window.location.pathname.includes('/article/');
    const basePath = isInArticleFolder ? '../components' : '/components';
    
    await loadComponent('header-component', `${basePath}/header.html`);
    await loadComponent('footer-component', `${basePath}/footer.html`);
    
    // コンポーネント読み込み完了を通知
    document.dispatchEvent(componentsLoadedEvent);
});

document.addEventListener('componentsLoaded', () => {
    // header-component が読み込まれた後、明示的にコントリビューショングリッドを初期化
    if (typeof renderContributionGrid === 'function') {
        renderContributionGrid();
    } else {
        // github-contributions.js が読み込まれていない場合は読み込む
        const script = document.createElement('script');
        script.src = '/js/github-contributions.js';
        script.onload = function() {
            if (typeof renderContributionGrid === 'function') {
                renderContributionGrid();
            }
        };
        document.head.appendChild(script);
    }
});