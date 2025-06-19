Write-Host "=============================================="
Write-Host "    DWSS-BIM Dashboard - GitHub Pages部署工具"
Write-Host "=============================================="
Write-Host ""

Write-Host "[步骤1] 检查Git安装..."
try {
    $gitVersion = git --version
    Write-Host "Git已找到! 继续部署..." -ForegroundColor Green
} catch {
    Write-Host "Git未找到! 请确保Git已安装并重启PowerShell或电脑" -ForegroundColor Red
    Write-Host "你可以尝试使用Git的完整路径，通常在:"
    Write-Host "C:\Program Files\Git\bin\git.exe"
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}
Write-Host ""

Write-Host "[步骤2] 检查Node.js安装..."
try {
    $nodeVersion = node --version
    Write-Host "Node.js已找到! 继续部署..." -ForegroundColor Green
} catch {
    Write-Host "Node.js未找到! 请确保Node.js已安装并重启PowerShell或电脑" -ForegroundColor Red
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}
Write-Host ""

Write-Host "[步骤3] 安装依赖..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "安装依赖失败! 请检查错误信息。" -ForegroundColor Red
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}
Write-Host ""

Write-Host "[步骤4] 构建项目..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建项目失败! 请检查错误信息。" -ForegroundColor Red
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}
Write-Host ""

Write-Host "[步骤5] 请输入你的GitHub用户名:"
$username = Read-Host "> "
Write-Host ""

Write-Host "[步骤6] 初始化Git仓库..."
git init
Write-Host ""

Write-Host "[步骤7] 添加所有文件..."
git add .
Write-Host ""

Write-Host "[步骤8] 提交更改..."
git commit -m "Initial commit - DWSS BIM Dashboard"
Write-Host ""

Write-Host "[步骤9] 创建main分支..."
git branch -M main
Write-Host ""

Write-Host "[步骤10] 添加远程仓库..."
git remote add origin "https://github.com/$username/DWSSS.git"
Write-Host ""

Write-Host "[步骤11] 推送到GitHub..."
Write-Host "注意: 接下来会提示输入GitHub账号和密码"
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "推送失败! 可能的解决方案:" -ForegroundColor Yellow
    Write-Host "1. 确认仓库地址是否正确"
    Write-Host "2. 确认GitHub账号和密码是否正确"
    Write-Host "3. 尝试执行: git pull --rebase origin main"
    Write-Host "   然后再次执行: git push -u origin main"
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}
Write-Host ""

Write-Host "=============================================="
Write-Host "    部署过程完成!" -ForegroundColor Green
Write-Host "=============================================="
Write-Host ""
Write-Host "接下来请:"
Write-Host "1. 访问 https://github.com/$username/DWSSS/settings/pages"
Write-Host "2. 在"Source"部分选择"GitHub Actions""
Write-Host "3. 等待几分钟，你的网站将部署在:"
Write-Host "   https://$username.github.io/DWSSS/"
Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 