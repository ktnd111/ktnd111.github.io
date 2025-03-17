// 定数
const GRID_COLUMNS = 20;
const GRID_ROWS = 7;
const USERNAME = 'ktnd111';

// コントリビューションデータの取得
async function fetchContributionData() {
    console.log('fetchContributionData: 開始');
    try {
        // 相対パスを使用してJSONファイルを取得
        const path = '../data/contributions.json';
        console.log(`JSONファイルを取得試行: ${path}`);
        
        const response = await fetch(path);
        console.log(`レスポンスステータス: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('データ取得成功:', data.username, '更新日時:', data.updated_at);
            console.log(`取得したデータ: ${data.contributions.length}日分`);
            return data;
        }
        
        throw new Error('JSONファイルの取得に失敗しました');
    } catch (error) {
        console.error('Error fetching contribution data:', error);
        console.log('デフォルトデータに切り替えます');
        return generateDefaultData();
    }
}

// デフォルトデータの生成
function generateDefaultData() {
    console.log('Generating default contribution data...');
    
    const days = GRID_COLUMNS * GRID_ROWS;
    const contributions = [];
    
    // 現在の日付から過去の日付を生成
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (days - 1 - i));
        
        // 日付をYYYY-MM-DD形式に変換
        const dateStr = date.toISOString().split('T')[0];
        
        // 行と列の位置を計算
        const row = Math.floor(i / GRID_COLUMNS);
        const col = i % GRID_COLUMNS;
        
        // パターンデータ生成（Kの形）
        let level = 0;
        let count = 0;
        
        if (col === 0 || // 縦線
            (row === 3 && col <= 10) || // 中央の横線
            (col <= 10 && row + col === 10) || // 左下の斜め線
            (col <= 10 && col - row === 4)) { // 右上の斜め線
            
            // レベル2-4をランダムに生成
            level = 2 + Math.floor(Math.random() * 3);
            count = level * 3;
        } else {
            // その他のセルは低いレベル（0-1）をランダムに
            level = Math.random() > 0.7 ? 1 : 0;
            count = level === 1 ? Math.floor(Math.random() * 2) + 1 : 0;
        }
        
        contributions.push({
            date: dateStr,
            count: count,
            level: level
        });
    }
    
    return {
        username: USERNAME,
        updated_at: new Date().toISOString(),
        note: 'This is default data generated because API data could not be retrieved',
        contributions: contributions
    };
}

// コントリビューショングリッドを描画
async function renderContributionGrid() {
    const gridContainer = document.getElementById('contribution-grid');
    const tooltip = document.getElementById('tooltip');
    
    try {
        // データを取得
        const data = await fetchContributionData();
        
        if (!data || !data.contributions || data.contributions.length === 0) {
            throw new Error('No contribution data available');
        }
        
        // 必要なセル数
        const cellCount = GRID_COLUMNS * GRID_ROWS;
        
        // 最新のデータを使用
        const contributions = data.contributions.slice(-cellCount);
        
        // グリッドをクリア
        gridContainer.innerHTML = '';
        
        // セルを生成
        contributions.forEach((contribution, index) => {
            const cell = document.createElement('div');
            cell.className = `contribution-cell contribution-level-${contribution.level}`;
            
            // 日付と貢献数をデータ属性として保存
            cell.dataset.date = contribution.date;
            cell.dataset.count = contribution.count;
            
            // ツールチップの表示
            cell.addEventListener('mouseover', (e) => {
                const date = new Date(contribution.date);
                const formattedDate = date.toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                tooltip.textContent = `${formattedDate}: ${contribution.count} contributions`;
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
                tooltip.style.display = 'block';
            });
            
            cell.addEventListener('mouseout', () => {
                tooltip.style.display = 'none';
            });
            
            gridContainer.appendChild(cell);
        });
        
        // グリッドをフェードイン
        setTimeout(() => {
            gridContainer.classList.add('loaded');
        }, 300);
        
        // ユーザー名表示などの追加情報（オプション）
        console.log(`Loaded contribution data for ${data.username}, last updated: ${data.updated_at}`);
        
    } catch (error) {
        console.error('Error rendering contribution grid:', error);
        
        // エラー時も見た目を維持するためにデフォルトを表示
        const defaultData = generateDefaultData();
        
        gridContainer.innerHTML = '';
        
        defaultData.contributions.forEach((contribution) => {
            const cell = document.createElement('div');
            cell.className = `contribution-cell contribution-level-${contribution.level}`;
            gridContainer.appendChild(cell);
        });
        
        setTimeout(() => {
            gridContainer.classList.add('loaded');
        }, 300);
    }
}

// 初期化関数
function initializeContributionGrid() {
    console.log('コントリビューショングリッドの初期化を開始');
    // グリッドコンテナの存在確認
    const gridContainer = document.getElementById('contribution-grid');
    if (!gridContainer) {
        console.log('グリッドコンテナが見つかりません。100ms後に再試行します');
        setTimeout(initializeContributionGrid, 100);
        return;
    }
    
    console.log('グリッドコンテナを発見、描画を開始します');
    renderContributionGrid();
}

// カスタムイベントリスナーを設定
document.addEventListener('header-loaded', function() {
    console.log('ヘッダー読み込みイベントを受信');
    initializeContributionGrid();
});

// 直接実行も試みる（ヘッダーが既に存在する場合のため）
console.log('直接初期化を試みます');
