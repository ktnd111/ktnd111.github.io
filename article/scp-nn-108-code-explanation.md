# SCP-NN-108のコード解説：不気味な雰囲気を演出する技術

SCP-NN-108のページで使用されているコードについて、技術的な実装方法とその選択理由を解説します。

## 1. ノイズアニメーション効果

### 実装コード

```css
@keyframes noise {
    0%, 100% { background-position: 0 0; }
    20% { background-position: 50% 50%; }
    40% { background-position: -50% -50%; }
    60% { background-position: -100% 100%; }
    80% { background-position: 100% -100%; }
}

body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.05;
    pointer-events: none;
    background-image: url("data:image/svg+xml,...");
    animation: noise 8s steps(10) infinite;
    z-index: 1;
}
```

### なぜこの実装を選んだのか？

1. **SVGノイズパターン**
   - インラインSVGを使用することで、外部画像への依存を減らし、ページの読み込み速度を最適化
   - `feTurbulence`フィルターにより、自然な模様のノイズを生成

2. **steps()関数の使用**
   - `animation: noise 8s steps(10) infinite`では、なめらかなアニメーションではなく、意図的に不連続な動きを作成
   - これにより、古いモニターやビデオの様な、より不気味な効果を演出

## 2. 警告表示の点滅効果

```css
.warning {
    background-color: var(--warning-color);
    color: white;
    padding: 20px;
    margin: 20px 0;
    text-align: center;
    animation: pulse 2s infinite;
    text-transform: uppercase;
    font-weight: bold;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
}
```

### なぜこの実装を選んだのか？

- 点滅効果は控えめな不透明度の変化（0.8〜1.0）を使用
- 激しい点滅は避け、微妙な変化にすることで、読みやすさを保ちながら警告感を演出
- `2s infinite`のタイミングは、人間の注意力のサイクルに合わせて設定

## 3. 機密文書の演出

```css
.classified {
    position: relative;
    overflow: hidden;
}

.classified::before {
    content: "TOP SECRET";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    color: rgba(196, 30, 58, 0.1);
    font-size: 100px;
    font-weight: bold;
    pointer-events: none;
    z-index: 1;
}
```

### なぜこの実装を選んだのか？

1. **疑似要素の活用**
   - `::before`疑似要素を使用することで、HTMLの構造を汚さずにスタイルを追加
   - `pointer-events: none`により、ウォーターマークがコンテンツの操作を妨げない

2. **位置とスタイル**
   - 45度回転させることで、従来の機密文書の印象を再現
   - 低い不透明度（0.1）により、文書の可読性を維持

## 4. レスポンシブデザインとコンテナ

```css
.container {
    max-width: 800px;
    margin: 0 auto;
    background-color: #1a1a1a;
    padding: 20px;
    border: 1px solid #333;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    position: relative;
    z-index: 2;
}
```

### なぜこの実装を選んだのか？

- `max-width`の使用により、大画面でも読みやすい行長を維持
- `box-shadow`により、コンテンツを背景から浮き上がらせ、重要な文書という印象を強調
- `z-index: 2`で、ノイズエフェクト（z-index: 1）の上にコンテナを配置

## 5. text-noise.jsによるテキストノイズ効果

このページでは外部JavaScriptファイル`text-noise.js`を使用して、テキストに動的なノイズ効果を適用しています。この効果により、文書の不気味さと異常性をより強く演出しています。

### 実装コード

```javascript
// テキストノイズエフェクトの実装
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    
    // テキストノードを再帰的に取得
    function getTextNodes(element) {
        let textNodes = [];
        function getNodes(node) {
            if (node.nodeType === 3 && node.textContent.trim() !== '') {
                textNodes.push(node);
            } else if (node.nodeType === 1) {
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

    const textNodes = getTextNodes(container);
    const originalContents = new Map();
    textNodes.forEach(node => {
        originalContents.set(node, node.textContent);
    });

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
                
                setTimeout(() => {
                    node.textContent = original;
                }, Math.random() * 500 + 100);
            }
        });
    }

    setTimeout(() => {
        setInterval(applyNoiseEffect, 3000);
    }, 2000);
});
```

### なぜこの実装を選んだのか？

1. **テキストノードの特定**
   - DOMツリーを再帰的に探索することで、すべてのテキストノードを確実に取得
   - 空のテキストノードを除外し、効率的な処理を実現

2. **ノイズ発生の最適化**
   - テキストの長さに応じて置換数を調整（3%）し、一定の視覚効果を維持
   - ノイズを適用する位置を事前に選択することで、均一な分布を実現
   - 空白文字を除外し、実際のテキスト部分のみにノイズを適用

3. **処理範囲の制御**
   - アクティブなノードを全体の5%に制限し、過剰な視覚的混乱を防止
   - ランダムな選択により、予測不可能性を維持しながら適度な効果を実現

4. **タイミング設計**
   - 初回実行を2秒遅延させることで、ページ読み込み直後の混乱を防止
   - エフェクトの適用間隔（3秒）は、読書の妨げにならない程度に設定
   - 元のテキストへの復帰時間（100-600ms）は、チラつきすぎないよう調整

5. **データの保持と効率性**
   - 元のテキストをMapで保持することで、確実な復元を保証
   - メモリ効率とパフォーマンスを考慮した実装

### なぜ外部ファイルとして実装したのか？

1. **再利用性**
   - 同様のエフェクトを他のSCPページでも使用可能
   - コードの保守性が向上

2. **パフォーマンス**
   - ブラウザのキャッシュ機能を活用可能
   - メインのHTMLファイルのサイズを削減

3. **テスト容易性**
   - エフェクトの調整やデバッグが容易
   - 他のJavaScriptコードから分離することで、影響範囲を制限

## まとめ

SCP-NN-108のページデザインでは、以下の点に注意して実装を行いました：

1. パフォーマンスを考慮した効率的なアニメーション
2. アクセシビリティを損なわない程度の視覚効果
3. モジュール化されたコード構造
4. 再利用可能なコンポーネント設計

これらの実装により、不気味な雰囲気を演出しながらも、実用的で保守しやすいウェブページを実現しています。
