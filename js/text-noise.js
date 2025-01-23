// テキストノイズエフェクトの実装
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    
    // テキストノードを再帰的に取得
    function getTextNodes(element) {
        let textNodes = [];
        
        function getNodes(node) {
            if (node.nodeType === 3 && node.textContent.trim() !== '') {
                // テキストノードかつ空でない場合
                textNodes.push(node);
            } else if (node.nodeType === 1) {
                // 要素ノードの場合、子ノードを再帰的に探索
                for (let child of node.childNodes) {
                    getNodes(child);
                }
            }
        }
        
        getNodes(element);
        return textNodes;
    }

    // テキストを▓に置換（ノイズの発生数を制御）
    function replaceWithBlocks(text) {
        const chars = Array.from(text);
        const totalChars = chars.filter(char => char.trim() !== '').length;
        // テキストの長さに応じて置換数を調整（約3%のノイズ率を目標）
        const targetNoiseCount = Math.max(1, Math.floor(totalChars * 0.03));
        
        // ノイズを適用する位置をランダムに選択
        let noisePositions = new Set();
        while (noisePositions.size < targetNoiseCount) {
            const pos = Math.floor(Math.random() * chars.length);
            if (chars[pos].trim() !== '') {
                noisePositions.add(pos);
            }
        }

        // 選択された位置にノイズを適用
        return chars.map((char, index) => 
            noisePositions.has(index) ? '▓' : char
        ).join('');
    }

    // テキストノードの元の内容を保存
    const textNodes = getTextNodes(container);
    const originalContents = new Map();
    textNodes.forEach(node => {
        originalContents.set(node, node.textContent);
    });

    // ノイズエフェクトを適用（一定数のノードのみ選択）
    function applyNoiseEffect() {
        // アクティブなノードの数を制限（全体の5%程度）
        const activeNodeCount = Math.max(1, Math.floor(textNodes.length * 0.05));
        const selectedNodes = new Set();
        
        // ランダムにノードを選択
        while (selectedNodes.size < activeNodeCount) {
            const index = Math.floor(Math.random() * textNodes.length);
            selectedNodes.add(textNodes[index]);
        }

        // 選択されたノードにのみエフェクトを適用
        textNodes.forEach(node => {
            if (selectedNodes.has(node)) {
                const original = originalContents.get(node);
                node.textContent = replaceWithBlocks(original);
                
                // 100-600ms後に元に戻す
                setTimeout(() => {
                    node.textContent = original;
                }, Math.random() * 500 + 100);
            }
        });
    }

    // 初回実行を遅延させる
    setTimeout(() => {
        // 定期的にエフェクトを実行
        setInterval(applyNoiseEffect, 4000);
    }, 2000);
});
