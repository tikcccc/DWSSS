Write-Host "=============================================="
Write-Host "    DWSS-BIM Dashboard - GitHub Pages部署工具"
Write-Host "=============================================="
Write-Host ""

Write-Host "[步骤1] 检查Git安装..." -ForegroundColor Cyan
try {
    $gitVersion = git --version
    Write-Host "Git已找到: $gitVersion" -ForegroundColor Green
}
catch {
    Write-Host "Git未找到! 请确保Git已安装并重启命令行或电脑" -ForegroundColor Red
    Write-Host "你可以尝试使用Git的完整路径，通常在:" -ForegroundColor Yellow
    Write-Host "C:\Program Files\Git\bin\git.exe" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""
Write-Host "[步骤2] 请输入你的GitHub用户名:" -ForegroundColor Cyan
$username = Read-Host "> "
Write-Host ""

# 检查是否已经存在.git文件夹
if (Test-Path ".git") {
    Write-Host "检测到已存在Git仓库，跳过初始化步骤" -ForegroundColor Yellow
}
else {
    Write-Host "[步骤3] 初始化Git仓库..." -ForegroundColor Cyan
    git init
    Write-Host ""
}

Write-Host "[步骤4] 添加所有文件..." -ForegroundColor Cyan
git add .
Write-Host ""

Write-Host "[步骤5] 提交更改..." -ForegroundColor Cyan
git commit -m "Initial commit - DWSS BIM Dashboard"
Write-Host ""

Write-Host "[步骤6] 创建main分支..." -ForegroundColor Cyan
git branch -M main
Write-Host ""

# 检查是否已经添加了远程仓库
$remoteExists = git remote -v | Select-String -Pattern "origin"
if ($remoteExists) {
    Write-Host "检测到已存在远程仓库，更新远程URL..." -ForegroundColor Yellow
    git remote set-url origin "https://github.com/$username/DWSSS.git"
}
else {
    Write-Host "[步骤7] 添加远程仓库..." -ForegroundColor Cyan
    git remote add origin "https://github.com/$username/DWSSS.git"
}
Write-Host ""

Write-Host "[步骤8] 推送到GitHub..." -ForegroundColor Cyan
Write-Host "注意: 接下来会提示输入GitHub账号和密码" -ForegroundColor Yellow
git push -u origin main
Write-Host ""

Write-Host "=============================================="
Write-Host "    部署过程完成!" -ForegroundColor Green
Write-Host "=============================================="
Write-Host ""
Write-Host "接下来请:" -ForegroundColor Cyan
Write-Host "1. 访问 https://github.com/$username/DWSSS/settings/pages"
Write-Host "2. 在'Build and deployment'部分选择'GitHub Actions'"
Write-Host "3. 等待几分钟，你的网站将部署在:"
Write-Host "   https://$username.github.io/DWSSS/" -ForegroundColor Green
Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 