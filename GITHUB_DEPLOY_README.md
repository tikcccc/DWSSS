# 🚀 GitHub Pages 一键部署指南

## 📋 前提条件

1. 已安装 Git (你已经完成这一步)
2. 拥有 GitHub 账号
3. 已创建名为 `DWSSS` 的仓库 (如果没有，请先在 GitHub 上创建)

## 🎯 部署方法 (二选一)

### 方法1: 使用批处理文件 (推荐)

1. 双击 `deploy-to-github.bat` 文件
2. 按照提示输入你的 GitHub 用户名
3. 系统将自动执行所有部署步骤
4. 完成后按照提示访问 GitHub 设置页面

### 方法2: 使用 PowerShell 脚本

1. 右键点击 `deploy-to-github-ps.ps1`，选择"使用 PowerShell 运行"
2. 如果出现安全警告，输入 `Y` 确认运行
3. 按照提示输入你的 GitHub 用户名
4. 系统将自动执行所有部署步骤
5. 完成后按照提示访问 GitHub 设置页面

## 🔧 部署后配置

1. 访问 `https://github.com/你的用户名/DWSSS/settings/pages`
2. 在 "Build and deployment" 部分选择 "GitHub Actions"
3. 等待几分钟，你的网站将部署在 `https://你的用户名.github.io/DWSSS/`

## 🚨 常见问题解决

### 问题1: "git不是内部或外部命令..."

如果刚安装Git，可能需要重启命令行或电脑。

### 问题2: 推送时身份验证失败

确保使用正确的GitHub账号和密码。如果启用了双因素认证，需要使用个人访问令牌 (PAT) 而不是密码。

### 问题3: 仓库已存在

如果提示仓库已存在，可能是你之前已经初始化过Git。脚本会自动处理这种情况。

## 📱 部署后功能

✅ 完整的BIM管理系统
✅ 响应式设计（支持手机/平板）
✅ HTTPS安全访问
✅ 全球CDN加速
✅ 自动更新部署 