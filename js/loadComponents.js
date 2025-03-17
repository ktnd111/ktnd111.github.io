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
