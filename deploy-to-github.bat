@echo off
echo ==============================================
echo    DWSS-BIM Dashboard - GitHub Pages部署工具
echo ==============================================
echo.

echo [步骤1] 检查Git安装...
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Git未找到! 请确保Git已安装并重启命令行或电脑
  echo 你可以尝试使用Git的完整路径，通常在:
  echo C:\Program Files\Git\bin\git.exe
  echo.
  echo 按任意键退出...
  pause >nul
  exit /b
)

echo Git已找到! 继续部署...
echo.

echo [步骤2] 检查Node.js安装...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js未找到! 请确保Node.js已安装并重启命令行或电脑
  echo.
  echo 按任意键退出...
  pause >nul
  exit /b
)

echo Node.js已找到! 继续部署...
echo.

echo [步骤3] 安装依赖...
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo 安装依赖失败! 请检查错误信息。
  echo.
  echo 按任意键退出...
  pause >nul
  exit /b
)
echo.

echo [步骤4] 构建项目...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo 构建项目失败! 请检查错误信息。
  echo.
  echo 按任意键退出...
  pause >nul
  exit /b
)
echo.

echo [步骤5] 请输入你的GitHub用户名:
set /p username="> "
echo.

echo [步骤6] 初始化Git仓库...
git init
echo.

echo [步骤7] 添加所有文件...
git add .
echo.

echo [步骤8] 提交更改...
git commit -m "Initial commit - DWSS BIM Dashboard"
echo.

echo [步骤9] 创建main分支...
git branch -M main
echo.

echo [步骤10] 添加远程仓库...
git remote add origin https://github.com/%username%/DWSSS.git
echo.

echo [步骤11] 推送到GitHub...
echo 注意: 接下来会提示输入GitHub账号和密码
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo 推送失败! 可能的解决方案:
  echo 1. 确认仓库地址是否正确
  echo 2. 确认GitHub账号和密码是否正确
  echo 3. 尝试执行: git pull --rebase origin main
  echo    然后再次执行: git push -u origin main
  echo.
  echo 按任意键退出...
  pause >nul
  exit /b
)
echo.

echo ==============================================
echo    部署过程完成!
echo ==============================================
echo.
echo 接下来请:
echo 1. 访问 https://github.com/%username%/DWSSS/settings/pages
echo 2. 在"Source"部分选择"GitHub Actions"
echo 3. 等待几分钟，你的网站将部署在:
echo    https://%username%.github.io/DWSSS/
echo.
echo 按任意键退出...
pause >nul 