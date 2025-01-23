// SCPファイルへのアクセス時の警告表示
document.addEventListener('DOMContentLoaded', () => {
    const scpLink = document.querySelector('.horror-link');
    const modal = document.getElementById('scp-modal');
    const proceedButton = document.getElementById('scp-proceed');
    const cancelButton = document.getElementById('scp-cancel');
    let targetUrl = '';

    // モーダルを表示する関数
    const showModal = (url) => {
        targetUrl = url;
        modal.style.display = 'block';
        // タイプライター効果でテキストを表示
        const texts = modal.querySelectorAll('.scp-modal-body p');
        texts.forEach((text, index) => {
            const originalText = text.textContent;
            text.textContent = '';
            let i = 0;
            setTimeout(() => {
                const typeWriter = setInterval(() => {
                    if (i < originalText.length) {
                        text.textContent += originalText.charAt(i);
                        i++;
                    } else {
                        clearInterval(typeWriter);
                    }
                }, 20);
            }, index * 500); // 各段落に遅延を追加
        });
    };

    // モーダルを非表示にする関数
    const hideModal = () => {
        modal.style.display = 'none';
        targetUrl = '';
    };

    // SCPリンクのクリックイベント
    if (scpLink) {
        scpLink.addEventListener('click', (e) => {
            e.preventDefault();
            showModal(e.currentTarget.href);
        });
    }

    // 続行ボタンのクリックイベント
    proceedButton.addEventListener('click', () => {
        if (targetUrl) {
            window.location.href = targetUrl;
        }
        hideModal();
    });

    // キャンセルボタンのクリックイベント
    cancelButton.addEventListener('click', hideModal);

    // モーダル外クリックでキャンセル
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // ESCキーでキャンセル
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            hideModal();
        }
    });
});
