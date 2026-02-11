# ReDav

> **Re-read your journey.** Your private Readwise on WebDAV.  
> 前端直连 WebDAV 的阅读笔记聚合工具，支持 AnxReader、MoonReader 等。

![ReDav Screenshot](./docs/screenshot.png)

## ✨ 特性

- **🔒 数据完全自主**：无后端存储，配置和数据仅保存在浏览器本地（IndexedDB/LocalStorage）。
- **☁️ WebDAV 直连**：支持任意标准 WebDAV 服务（坚果云、Nas、Nextcloud 等）。
- **📚 多源支持**：
  - **AnxReader** (自动同步 .db 数据库)
  - **MoonReader (静读天下)** (解析 .an/.mrex 格式)
- **🎨 现代化体验**：
  - 响应式设计 (Mobile/Desktop)
  - **深色模式**完美适配
  - 极速搜索与筛选
- **📤 强大的导出**：
  - 支持 **Markdown**, **Obsidian**, **Notion** 等多种格式
  - 自定义导出模板（支持变量插值）
  - 实时预览与一键复制

## 🚀 快速部署

ReDav 是一个纯静态单页应用 (SPA)，配合轻量级代理解决 CORS 问题。

### 方式一：Cloudflare Pages (推荐)

本项目已针对 Cloudflare Pages 优化，内置 `/functions` 目录处理 WebDAV 代理。

1. Fork 本仓库
2. 在 Cloudflare Dashboard 创建 Pages 项目，连接你的 GitHub 仓库
3. 构建设置：
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. 部署完成后即可使用！

### 方式二：Docker 自托管

```bash
docker run -d -p 8080:80 ghcr.io/seeyou2n1ght/redav:latest
```
*(Docker 镜像构建脚本即将推出)*

### 方式三：本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (含本地代理)
npm run dev

# 启动本地后端代理 (Cloudflare Pages 模拟)
npm run dev:pages
```

## 🛠️ 配置指南

首次访问需在【设置】页面配置数据源：

1. **WebDAV 地址**: 你的 WebDAV 服务器地址 (如 `https://dav.jianguoyun.com/dav/`)
2. **账户密码**: 你的 WebDAV 账号和应用密码
3. **书库路径**: 阅读器数据同步在 WebDAV 上的文件夹路径
   - AnxReader 默认为 `/AnxReader` (存放 .db 文件)
   - MoonReader 默认为 `/Books/.MoonReader/Backup` (存放 .an/.mrex 文件)

> ⚠️ **注意**：由于浏览器安全限制 (CORS)，直接连接 WebDAV 通常会失败。ReDav 默认使用内置的 `/api/proxy` 转发请求。你也可以在设置中心配置自定义代理服务。

## 🏗️ 技术栈

- **Core**: React 18, TypeScript, Vite
- **State**: Zustand (Persistence), TanStack Query
- **UI**: TailwindCSS 4, shadcn/ui, Lucide Icons
- **Storage**: IndexedDB (Dexie.js) for caching
- **Parser**: sql.js (SQLite), pako (GZIP)

## 📄 许可证

MIT License © 2024-Present [ReDav Contributors](https://github.com/seeyou2n1ght/ReDav/graphs/contributors)
