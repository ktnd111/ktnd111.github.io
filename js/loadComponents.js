async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        
        // スクリプトタグを探して実行する
        const scriptTags = document.getElementById(elementId).querySelectorAll('script');
        scriptTags.forEach(oldScript => {
            const newScript = document.createElement('script');
            
            // 属性をコピー
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // インラインスクリプトの場合は内容をコピー
            newScript.textContent = oldScript.textContent;
            
            // 古いスクリプトを新しいものと置き換え
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    } catch (error) {
        console.error(`Error loading component from ${componentPath}:`, error);
    }
}