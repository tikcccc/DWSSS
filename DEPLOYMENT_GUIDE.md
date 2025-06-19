# DWSS-BIM Dashboard 部署指南

本文档提供了将 DWSS-BIM Dashboard 部署到 GitHub Pages 的详细步骤。

## 前提条件

在开始部署之前，请确保您已经：

1. 安装了 [Git](https://git-scm.com/downloads)
2. 安装了 [Node.js](https://nodejs.org/) (推荐使用 LTS 版本)
3. 拥有一个 GitHub 账号
4. 在 GitHub 上创建了一个名为 `DWSSS` 的仓库

## 部署方法

### 方法一：使用批处理脚本 (Windows)

1. 打开命令提示符 (CMD)
2. 导航到项目根目录
3. 运行 `deploy-to-github.bat` 脚本
4. 按照脚本提示输入您的 GitHub 用户名
5. 等待脚本完成部署过程

### 方法二：使用 PowerShell 脚本 (Windows)

1. 打开 PowerShell
2. 导航到项目根目录
3. 运行 `./deploy-to-github.ps1` 脚本
4. 按照脚本提示输入您的 GitHub 用户名
5. 等待脚本完成部署过程

### 方法三：手动部署

如果自动部署脚本遇到问题，您可以按照以下步骤手动部署：

1. 安装依赖：
   ```
   npm install
   ```

2. 构建项目：
   ```
   npm run build
   ```

3. 初始化 Git 仓库：
   ```
   git init
   ```

4. 添加所有文件：
   ```
   git add .
   ```

5. 提交更改：
   ```
   git commit -m "Initial commit - DWSS BIM Dashboard"
   ```

6. 创建 main 分支：
   ```
   git branch -M main
   ```

7. 添加远程仓库（将 YOUR_USERNAME 替换为您的 GitHub 用户名）：
   ```
   git remote add origin https://github.com/YOUR_USERNAME/DWSSS.git
   ```

8. 推送到 GitHub：
   ```
   git push -u origin main
   ```

## 配置 GitHub Pages

部署完成后，您需要配置 GitHub Pages 以启用网站：

1. 访问您的 GitHub 仓库 (https://github.com/YOUR_USERNAME/DWSSS)
2. 点击 "Settings" 选项卡
3. 在左侧菜单中点击 "Pages"
4. 在 "Build and deployment" 部分下：
   - Source: 选择 "GitHub Actions"
5. 等待几分钟，您的网站将部署在：https://YOUR_USERNAME.github.io/DWSSS/

## 常见问题

### 推送到 GitHub 失败

如果在推送到 GitHub 时遇到错误，可能是因为：

1. 远程仓库已经包含了一些文件（例如 README.md）
2. 您的本地仓库与远程仓库不同步

解决方案：

```
git pull --rebase origin main
git push -u origin main
```

### 部署后网站无法访问

1. 确认 GitHub Actions 工作流是否成功运行
2. 检查 GitHub Pages 设置是否正确
3. 等待几分钟，GitHub Pages 部署可能需要一些时间

### 其他问题

如果遇到其他问题，请查看 GitHub Actions 日志以获取更多信息，或者参考 [GitHub Pages 文档](https://docs.github.com/en/pages)。 