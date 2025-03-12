---
title: "PowerShellでファイルを一括リネームする"
emoji: "✏️"
type: "tech"
topics:
  - "powershell"
  - "効率化"
published: true
published_at: "2025-01-09 00:15"
---

Windowsで大量のファイルをリネームするなら、手作業よりもPowerShellを使ったほうがずっとスマート！ 簡単なスクリプトで一括リネームができるので、初心者でもすぐに始められます。 本記事では、基本的なサンプルから応用テクニックまでをわかりやすく紹介します。

## PowerShellの基本操作

### 必要な準備
1. **PowerShellの起動**  
   スタートメニューで「PowerShell」と検索し、起動します。

2. **スクリプト実行ポリシーの設定（必要に応じて）**  
   スクリプトを実行する前に、以下のコマンドで一時的にポリシーを変更します（管理者権限が必要です）。
システム設定の変更につきご使用の際は注意してください。

```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## 基本例: ファイル名のプレフィックスを変更
以下のスクリプトは、特定のファイルに新しいプレフィックスを追加する例です。
サンプルとして以下のようなフォルダとリネーム対象を用意しました。ひとつずつ手で修正していくと時間がかかる上にミスを誘発しやすいため、スクリプトでざっと修正してしまいたいです。

`01-**.jpg`の連番ファイルをすべて`01-01-01-**.jpg`に変更します。

![](https://storage.googleapis.com/zenn-user-upload/f0eb12e038cf-20250109.png)
```powershell:PowerShell_Sample.ps1
# 新しいプレフィックス
$prefix = "01-01-01-"

# 対象フォルダ
$folderPath = "C:\Users\YourFolder"

# フォルダに移動
Set-Location -Path $folderPath

# ファイルをリネーム
Get-ChildItem -Filter "01-*.jpg" | ForEach-Object {
    $newName = $prefix + $_.Name.Substring(3)
    Rename-Item $_.FullName $newName
}
```

- **変更例**:  
  `00-01.jpg` → `01-01-01-01.jpg`

![](https://storage.googleapis.com/zenn-user-upload/20a1fd901fb9-20250109.png)
:::message
実行にはpowershellのウインドウから直接ファイルを指定、もしくはps1ファイル右クリックから実行できます。
:::

## 応用編

### 応用例1: ファイル名にタイムスタンプを追加
タイムスタンプを付与することで、ファイルの管理が容易になります。
下記コードでは既にタイムスタンプの形式をチェックし、付与されているファイルは無視して実行します。
タイムスタンプの存在チェックにはフォーマット指定を行っているため、実行には注意してください。

```powershell:Add_Timestamp.ps1
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$folderPath = "C:\Users\YourFolder"

Set-Location -Path $folderPath

Get-ChildItem | ForEach-Object {
    $fileNameWithoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $extension = $_.Extension

    if ($fileNameWithoutExtension -notmatch '^\d{8}-\d{6}_') {
        $newName = "{0}_{1}{2}" -f $timestamp, $fileNameWithoutExtension, $extension
        Rename-Item -Path $_.FullName -NewName $newName
    }
}
```

- **変更例**:  
  `image.jpg` → `20241227-153000_image.jpg`

---

### 応用例2: ファイル拡張子を一括変更
すべてのファイルの拡張子を `.jpg`から`.png` に変更する方法です。

```powershell:Change_Extention.ps1
$folderPath = "C:\Users\YourFolder"

Set-Location -Path $folderPath
Get-ChildItem -Filter "*.jpg" | ForEach-Object {
    $newName = [System.IO.Path]::ChangeExtension($_.Name, ".png")
    Rename-Item $_.FullName $newName
}
```

- **変更例**:  
  `picture.jpg` → `picture.png`
（この変更はあくまでサンプルです。互換性等注意してください。）

### 応用例3: 特定のキーワードを含むファイルだけをリネーム
条件を指定してファイル名を変更します。

```powershell:Rename_TargetWord.ps1
$folderPath = "C:\Users\YourFolder"

Set-Location -Path $folderPath
Get-ChildItem -Filter "*.jpg" | Where-Object { $_.Name -like "*target*" } | ForEach-Object {
    $newName = $_.Name.Replace("target", "processed")
    Rename-Item $_.FullName $newName
}
```

- **変更例**:  
  `target-image.jpg` → `processed-image.jpg`

## コマンド
### 使用したコマンド
| コマンド| 説明| 例|
|-|-|-|
| Set-Location| 現在の作業ディレクトリを指定したパスに変更する| Set-Location -Path "C:\\path\\to\\dir"  |
| Get-ChildItem| 指定したディレクトリ内のファイルやフォルダを取得する| Get-ChildItem -Filter "*.txt"|
| Rename-Item| ファイルやフォルダの名前を変更する| Rename-Item -Path "old.txt" -NewName "new.txt" |
| Write-Host| コンソールにメッセージを表示する| Write-Host "Process completed!"|
| Get-Date| 現在の日付と時間を取得する| Get-Date -Format "yyyyMMdd-HHmmss"|
| ForEach-Object | 各オブジェクトに対してアクションを実行する| Get-ChildItem | ForEach-Object { $_.Name } |
| -notmatch| 指定した正規表現に一致しないかを確認する| if ($value -notmatch "pattern") { ... } |


| コマンド| 説明| 例|
|-|-|-|
| [System.IO.Path]::<br>GetFileNameWithoutExtension | ファイル名から拡張子を除いた部分を取得する | [System.IO.Path]::<br>GetFileNameWithoutExtension("file.txt") |
| [System.IO.Path]::<br>ChangeExtension | ファイルの拡張子を変更する| [System.IO.Path]::<br>ChangeExtension("file.txt", ".jpg") |


### 標準的なコマンド
| コマンド| 説明| 例|
|-|-|-|
| ls| ディレクトリ内のファイルやフォルダを一覧表示 | ls -l|
| cd| 現在のディレクトリを変更| cd /path/to/folder|
| mkdir| 新しいディレクトリを作成| mkdir new_folder|
| rm| ファイルやディレクトリを削除| rm file.txt|
| cp| ファイルをコピー| cp source.txt destination.txt|
| mv| ファイルやフォルダを移動または名前変更| mv old_name.txt new_name.txt       
| echo| 指定したテキストを出力| echo 'Hello, World!'|
| cat| ファイルの内容を表示| cat file.txt|
| touch| 空のファイルを作成| touch newfile.txt|

## さいごに
PowerShellを使うことで、煩雑なファイルリネーム作業を効率的に自動化できます。この記事で紹介した方法を参考に、ぜひ日常業務や趣味の管理に活用してみてください！ 😊

**IT業界に、ITエンジニアに貢献する企業**
ONE WEDGEはServerlessシステム開発を中核技術としてWeb系システム開発、AWS/GCPを利用した業務システム・サービス開発、PWAを用いたモバイル開発、Alexaスキル開発など、元気と技術力を武器にお客様に真摯に向き合う価値創造企業です。

https://onewedge.co.jp/