# GitHub Pages 404 错误排查指南

如果您在访问 GitHub Pages 网站时遇到 "404 - There isn't a GitHub Pages site here" 错误，请按照以下步骤进行排查：

## 1. 检查 GitHub Actions 工作流

首先，确认 GitHub Actions 工作流是否成功运行：

1. 访问您的 GitHub 仓库：https://github.com/tikcccc/DWSSS
2. 点击顶部的 "Actions" 选项卡
3. 查看最新的工作流运行状态
   - 绿色勾表示成功
   - 红色叉表示失败
4. 如果失败，点击该工作流查看详细错误信息

## 2. 检查 GitHub Pages 设置

确认 GitHub Pages 设置是否正确：

1. 访问您的 GitHub 仓库：https://github.com/tikcccc/DWSSS
2. 点击顶部的 "Settings" 选项卡
3. 在左侧菜单中点击 "Pages"
4. 检查以下设置：
   - **Source**: 应该设置为 "Deploy from a branch"
   - **Branch**: 应该选择 "gh-pages" 分支和 "/ (root)" 文件夹
   - 如果没有 gh-pages 分支，可能是工作流尚未成功运行

## 3. 手动创建 gh-pages 分支

如果 GitHub Actions 工作流一直失败，您可以尝试手动创建 gh-pages 分支：

```bash
# 构建项目
npm run build

# 创建 gh-pages 分支
git checkout --orphan gh-pages

# 删除除了 dist 目录之外的所有文件
git rm -rf .
git add dist

# 将 dist 目录中的文件移动到根目录
cp -r dist/* .
rm -rf dist

# 提交更改
git add .
git commit -m "Manual GitHub Pages deployment"

# 推送到 GitHub
git push origin gh-pages --force

# 切回 main 分支
git checkout main
```

## 4. 检查域名设置

如果您设置了自定义域名，请确保：

1. 在 GitHub Pages 设置中正确配置了自定义域名
2. DNS 记录已正确设置
3. 等待 DNS 传播完成（可能需要 24-48 小时）

## 5. 等待部署完成

GitHub Pages 部署可能需要一些时间：

1. 即使 GitHub Actions 工作流显示成功，GitHub Pages 的实际部署可能还需要几分钟
2. 尝试清除浏览器缓存或使用隐私模式访问网站

## 6. 检查 404.html 文件

确保您的项目中包含一个 404.html 文件：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      background-color: #f7f8fb;
    }
    .container {
      max-width: 600px;
      padding: 40px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #e53e3e;
      margin-top: 0;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
    }
    a {
      color: #3182ce;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for might have been removed or is temporarily unavailable.</p>
    <p><a href="/">Return to Homepage</a></p>
  </div>
</body>
</html>
```

## 7. 联系 GitHub 支持

如果以上步骤都无法解决问题，您可以：

1. 查阅 [GitHub Pages 文档](https://docs.github.com/en/pages)
2. 检查 [GitHub Status](https://www.githubstatus.com/) 页面，查看是否有服务中断
3. 在 [GitHub Community](https://github.community/) 论坛中寻求帮助 