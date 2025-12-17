param(
  [string]$SubBranch = "sub",   # 作業ブランチ名（必要なら変更）
  [string]$MainBranch = "main", # メインブランチ名
  [string]$Remote = "origin"    # リモート名
)

# ➀ subブランチにアクセス
git checkout $SubBranch

# ② 変更をステージング（必要に応じて対象を調整）
git add .

# ここで一時停止し、別ターミナルや Cursor でコミットメッセージを生成して git commit する
Read-Host | Out-Null

# sub ブランチをリモートにプッシュ（PR作成のために必要）
git push $Remote $SubBranch

# ➆ mainブランチを GitHub にプルリクエスト（gh CLI 使用）
# PR はマージ前に作成する必要があるため、ここで作成
$ghPath = $null
if (Get-Command gh -ErrorAction SilentlyContinue) {
  $ghPath = "gh"
} elseif (Test-Path "C:\Program Files\GitHub CLI\gh.exe") {
  $ghPath = "C:\Program Files\GitHub CLI\gh.exe"
}

if ($ghPath) {
  & $ghPath pr create `
    --base $MainBranch `
    --head $SubBranch `
    --title "merge sub into main" `
    --body "PR created by git-flow script."
} else {
  Write-Host "[INFO] GitHub CLI (gh) is not installed. Please create PR manually on GitHub."
}

# ➄ mainブランチに切り替え
git checkout $MainBranch

# ➅ sub を main にマージ
git merge $SubBranch

# main をリモートにプッシュ
git push $Remote $MainBranch

# ⑧ subブランチに戻る
git checkout $SubBranch

# ⑨ main の最新を sub に取り込んで追従させる
git merge $MainBranch

# sub もリモートに反映
git push $Remote $SubBranch