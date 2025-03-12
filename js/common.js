document.addEventListener('DOMContentLoaded', function() {
    // ヘッダーを挿入
    const header = document.getElementById('common-header');
    if (header) {
        header.innerHTML = `
            <div class="container">
                <header>
                    <h1 class="text-center mb-4">KTND111's Personal.GITHUB.IO</h1>
                    <nav class="navbar navbar-expand-lg navbar-light bg-light rounded mb-4">
                        <div class="container-fluid">
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <div class="collapse navbar-collapse" id="navbarNav">
                                <ul class="navbar-nav mx-auto">
                                    <li class="nav-item">
                                        <a class="nav-link" href="/index.html" id="nav-home">HOME</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="/blog/techBlog.html" id="nav-techblog">TECH BLOG</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="/blog/about.html" id="nav-about">ABOUT</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                </header>
            </div>
        `;

        // 現在のページに基づいてナビゲーションのアクティブ状態を設定
        const currentPath = window.location.pathname;
        if (currentPath.includes('/index.html') || currentPath === '/') {
            document.getElementById('nav-home').classList.add('active');
        } else if (currentPath.includes('/blog/techBlog.html')) {
            document.getElementById('nav-techblog').classList.add('active');
        } else if (currentPath.includes('/blog/about.html')) {
            document.getElementById('nav-about').classList.add('active');
        }
    }

    // フッターを挿入
    const footer = document.getElementById('common-footer');
    if (footer) {
        footer.innerHTML = `
            <div class="container">
                <footer class="text-center">
                    <p>&copy; 2025 KTND111's Personal.GITHUB.IO. Powered by GitHub Pages.</p>
                </footer>
            </div>
        `;
    }
});
