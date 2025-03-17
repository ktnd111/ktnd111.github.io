const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const USERNAME = 'ktnd111'; // GitHubユーザー名
const API_URL = `https://github-contributions-api.jogruber.de/v4/${USERNAME}`;
const OUTPUT_DIR = path.join(__dirname, '../../data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'contributions.json');

async function fetchContributionData() {
  try {
    console.log(`Fetching contribution data for ${USERNAME}...`);
    
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 直近の140日分のデータを取得
    const contributions = data.contributions || [];
    const recentContributions = contributions.slice(-140);
    
    // 貢献度レベルに変換（0-4）
    const formattedData = recentContributions.map(day => {
      const count = day.count || 0;
      let level = 0;
      
      if (count === 0) level = 0;
      else if (count <= 2) level = 1;
      else if (count <= 5) level = 2;
      else if (count <= 10) level = 3;
      else level = 4;
      
      return {
        date: day.date,
        count: day.count,
        level: level
      };
    });
    
    // JSONファイルとしての出力データを作成
    const outputData = {
      username: USERNAME,
      updated_at: new Date().toISOString(),
      contributions: formattedData
    };
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // ファイルに保存
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    
    console.log(`Contribution data saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error fetching contribution data:', error);
    
    // エラー時はデフォルトデータを生成
    generateDefaultData();
  }
}

function generateDefaultData() {
  console.log('Generating default contribution data...');
  
  const days = 140; // 20列×7行
  const contributions = [];
  
  // 現在の日付から140日前までのデータを生成
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));
    
    // 日付をYYYY-MM-DD形式に変換
    const dateStr = date.toISOString().split('T')[0];
    
    // 行と列の位置を計算
    const row = Math.floor(i / 20);
    const col = i % 20;
    
    // パターンデータ生成
    let level = 0;
    let count = 0;
    
    // Kの形を描く
    if (col === 0 || // 縦線
        (row === 3 && col <= 10) || // 中央の横線
        (col <= 10 && row + col === 10) || // 左下の斜め線
        (col <= 10 && col - row === 4)) { // 右上の斜め線
      
      // レベル2-4をランダムに生成
      level = 2 + Math.floor(Math.random() * 3);
      count = level * 3; // レベルに応じた適当なカウント値
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
  
  // JSONファイルとしての出力データを作成
  const outputData = {
    username: USERNAME,
    updated_at: new Date().toISOString(),
    note: 'This is default data generated because API data could not be retrieved',
    contributions: contributions
  };
  
  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // ファイルに保存
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  
  console.log(`Default contribution data saved to ${OUTPUT_FILE}`);
}

// 実行
fetchContributionData();
