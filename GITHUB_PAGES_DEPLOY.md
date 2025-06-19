# 🚀 GitHub Pages 部署指南

## 📋 **方法1: 网页端手动部署（推荐，无需安装Git）**

### **第1步: 创建GitHub仓库**

1. 访问 [https://github.com](https://github.com)
2. 登录或注册账号
3. 点击右上角的 "+" 按钮，选择 "New repository"
4. **仓库设置**：
   - Repository name: `DWSSS` （重要：必须与vite.config.ts中的base路径一致）
   - Description: `DWSS-BIM Dashboard - 数字工程监督系统`
   - 选择 "Public" （GitHub Pages免费版需要公开仓库）
   - ✅ 勾选 "Add a README file"
   - 点击 "Create repository"

### **第2步: 上传项目文件**

1. **进入仓库页面**，点击 "uploading an existing file"
2. **选择文件**：将以下文件/文件夹拖拽到GitHub：
   ```
   📁 src/                    (源代码文件夹)
   📁 dist/                   (构建后的文件)
   📁 .github/                (GitHub Actions配置)
   📄 index.html
   📄 package.json
   📄 package-lock.json
   📄 vite.config.ts
   📄 tailwind.config.js
   📄 tsconfig.json
   📄 .gitignore
   📄 netlify.toml
   📄 README.md
   ```

3. **提交更改**：
   - Commit message: `Initial commit - DWSS BIM Dashboard`
   - 点击 "Commit changes"

### **第3步: 启用GitHub Pages**

1. **进入仓库设置**：
   - 在仓库页面点击 "Settings" 标签
   - 向下滚动找到 "Pages" 选项

2. **配置GitHub Pages**：
   - Source: 选择 "GitHub Actions"
   - 会看到提示：GitHub Actions workflows can now build and deploy your site

3. **等待自动部署**：
   - GitHub会自动识别GitHub Actions配置
   - 第一次部署需要2-3分钟
   - 部署完成后会显示网站URL

### **第4步: 访问你的网站**

部署成功后，你的网站地址为：
```
https://你的用户名.github.io/DWSSS/
```

---

## 📋 **方法2: 命令行部署（需要安装Git）**

如果你想使用命令行：

### **安装Git**
1. 下载：[https://git-scm.com/download/win](https://git-scm.com/download/win)
2. 安装后重启命令行

### **部署命令**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/DWSSS.git
git push -u origin main
```

---

## ⚡ **自动部署说明**

我已经配置了GitHub Actions自动部署：

- **文件位置**: `.github/workflows/deploy.yml`
- **触发条件**: 每次推送到main分支
- **部署过程**: 
  1. 自动安装依赖
  2. 构建项目
  3. 部署到GitHub Pages
- **部署时间**: 2-3分钟

---

## 🔧 **如果需要更新网站**

### **方法1: 网页端更新**
1. 重新构建: `npm run build`
2. 在GitHub仓库中替换 `dist` 文件夹
3. 提交更改，自动重新部署

### **方法2: 命令行更新**
```bash
npm run build
git add .
git commit -m "Update website"
git push
```

---

## 🚨 **常见问题解决**

### **问题1: 404错误**
确保 `vite.config.ts` 中的 `base` 路径与仓库名一致：
```typescript
base: '/DWSSS/', // 必须与仓库名匹配
```

### **问题2: 静态资源加载失败**
检查构建后的文件路径是否正确

### **问题3: 部署失败**
检查 `.github/workflows/deploy.yml` 文件是否存在

---

## 📱 **部署后功能**

✅ 完整的BIM管理系统
✅ 响应式设计（支持手机/平板）
✅ HTTPS安全访问
✅ 全球CDN加速
✅ 自动更新部署

---

## 🎯 **快速开始**

1. 创建GitHub仓库（名称：DWSSS）
2. 上传所有项目文件
3. 启用GitHub Pages
4. 等待部署完成
5. 访问你的网站！

**预计总时间**: 10-15分钟 