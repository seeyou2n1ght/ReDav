# ReDav

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/seeyou2n1ght/ReDav)

> Re-read your journey. Your private Readwise on WebDAV.

ReDav 是一个纯前端、无状态、可一键部署的轻量级阅读笔记聚合工具。让你的阅读笔记不再沉睡在 WebDAV 网盘中。

## 特性

- **数据自主** - 笔记永远在你自己的 WebDAV 里，ReDav 只是一个"眼镜"
- **多阅读器支持** - 支持 AnxReader、MoonReader(静读天下) 等主流阅读应用
- **统一体验** - 将不同格式的笔记统一为标准化阅读卡片
- **一键部署** - 基于 Cloudflare Pages，零服务器维护成本
- **隐私优先** - 无账户系统，配置存储在浏览器本地

## 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 开发进度

### ✅ 已完成

- ✅ **WebDAV Proxy** - Cloudflare Pages Function 实现
  - 支持 PROPFIND、GET 请求
  - 完整的 CORS 处理
  - Basic Authentication 透传
  
- ✅ **useWebDav Hook** - 支持 WebDAV 的 ls（列出目录）和 cat（读取文件）操作
  - 集成 TanStack Query，提供自动缓存和状态管理
  - 支持通过 Proxy 透传请求，避免 CORS 问题
  - 完整的 TypeScript 类型定义
  - 支持二进制文件读取（arraybuffer）

- ✅ **AnxReader 适配器** - SQLite 数据库解析
  - 基于 sql.js 的浏览器端解析
  - IndexedDB 缓存 + ETag 增量同步
  - 书籍与笔记聚合

- ✅ **MoonReader 适配器** - .an 文件解压与 Gap Analysis 解析
  - pako 多重解压策略（inflateRaw → inflate → ungzip）
  - Gap Analysis 算法精准提取笔记
  - 并行下载优化（限流 5 个）
  - IndexedDB 缓存 + lastModified 增量同步

### 🚧 进行中

- 🚧 **聚合层开发** - useAllNotes Hook
- 🚧 **UI 组件开发** - 书架视图、笔记流视图

## 项目结构

```
redav/
├── src/                    # 前端源代码
│   ├── components/        # UI 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── adapters/          # 阅读器适配器
│   ├── utils/             # 工具函数
│   └── types/             # 类型定义
├── functions/             # Cloudflare Pages Functions
│   └── proxy.ts          # WebDAV 代理
├── public/               # 静态资源
└── package.json
```

## 使用 useWebDav Hook

### 基本用法

```typescript
import { useWebDav } from './hooks/useWebDav'
import type { AppConfig } from './types'

function MyComponent() {
  const config: AppConfig = {
    webdav: {
      url: 'https://dav.example.com',
      username: 'user',
      password: 'pass'
    },
    proxy: {
      url: 'https://proxy.example.com'
    }
  }

  // 列出目录内容
  const { ls } = useWebDav('/Books', config)
  const { data: items, isLoading, error } = ls()

  // 读取文件内容
  const { cat } = useWebDav('/Books/note.json', config)
  const { data: content, isLoading, error } = cat()

  // ...
}
```

### 配置说明

在使用 ReDav 前，你需要配置以下信息：

1. **数据源 (Source)** - WebDAV 地址、账号、密码
2. **连接管道 (Pipeline)** - Proxy URL（可选，默认为官方代理）

配置示例：

```typescript
const config: AppConfig = {
  webdav: {
    url: 'https://dav.example.com',
    username: 'your-username',
    password: 'your-password'
  },
  proxy: {
    url: 'https://your-proxy.com'  // 可选，默认为官方代理
  }
}
```

## 技术栈

- **前端**: React 18 + Vite 5 + TypeScript 5
- **UI**: Tailwind CSS 4 + shadcn/ui
- **状态**: React Context + TanStack Query 5 + Dexie.js
- **后端**: Cloudflare Workers
- **部署**: Cloudflare Pages

## 开发计划与文档

- [产品需求文档 (PRD)](./docs/PRD.md)
- [技术规格说明书 (SPEC)](./docs/SPEC.md)

参见上述文档了解详细的产品需求、技术架构和开发路线图。

## 许可证

MIT
