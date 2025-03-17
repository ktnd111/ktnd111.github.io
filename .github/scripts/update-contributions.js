const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const USERNAME = 'ktnd111'; // GitHubユーザー名
// オプション1: 代替APIを使用する
const API_URL = `https://github-contributions.now.sh/api/v1/${USERNAME}`;
// オプション2: 別のAPIを試す場合のバックアップ
const BACKUP_API_URL = `https://skyline.github.com/${USERNAME}/2024.json`;

const OUTPUT_DIR = path.join(__dirname, '../../data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'contributions.json');

async function fetchContributionData() {
  try {
    console.log(`Fetching contribution data for ${USERNAME}...`);
    
    // メインAPIを試す
    let response = await fetch(API_URL);
    
    // メインAPIが失敗した場合、バックアップAPIを試す
    if (!response.ok) {
      console.log(`Primary API failed with status: ${response.status}. Trying backup API...`);
      response = await fetch(BACKUP_API_URL);
      
      if (!response.ok) {
        throw new Error(`Both APIs failed. Backup API status: ${response.status}`);
      }
    }
    
    // レスポンスJSONを取得
    const data = await response.json();
    console.log('API response structure:', Object.keys(data));
    
    // データ構造に基づいて取得ロジックを調整
    let contributions = [];
    
    // github-contributions.now.sh APIの場合
    if (data.contributions) {
      contributions = data.contributions;
    } 
    // skyline APIの場合
    else if (data.contributions_calendar) {
      contributions = data.contributions_calendar.map(day => ({
        date: day.date,
        count: day.count
      }));
    }
    
    // API応答がエラーか空の場合
    if (!contributions || contributions.length === 0) {
      console.log('No contribution data received from API. Generating default data...');
      return generateDefaultData();
    }
    
    console.log(`Received ${contributions.length} days of contribution data`);
    
    // 直近の140日分のデータを取得
    // データが少ない場合は全てのデータを使用
    const recentContributions = contributions.length > 140 
      ? contributions.slice(-140) 
      : contributions;
    
    console.log(`Using ${recentContributions.length} days of recent contribution data`);
    
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
        count: count,
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