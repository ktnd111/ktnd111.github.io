// ホラーリンクのタッチインタラクション制御
document.addEventListener('DOMContentLoaded', function() {
    const horrorLinks = document.querySelectorAll('.horror-link');

    // タッチデバイスの判定
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
        horrorLinks.forEach(link => {
            // タッチスタート時のエフェクト
            link.addEventListener('touchstart', function(e) {
                // デフォルトのホバー状態をキャンセル
                this.classList.remove('hover');
                // タッチエフェクトを適用
                this.classList.add('touch-active');
            });

            // タッチ終了時のエフェクト解除
            link.addEventListener('touchend', function(e) {
                this.classList.remove('touch-active');
            });

            // タッチがキャンセルされた場合のエフェクト解除
            link.addEventListener('touchcancel', function(e) {
                this.classList.remove('touch-active');
            });
        });
    }
});
