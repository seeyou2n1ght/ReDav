# ReDav

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

## 配置说明

在使用 ReDav 前，你需要配置以下信息：

1. **数据源 (Source)** - WebDAV 地址、账号、密码
2. **连接管道 (Pipeline)** - Proxy URL（可选，默认为官方代理）

## 技术栈

- **前端**: React 18 + Vite 5 + TypeScript 5
- **UI**: Tailwind CSS 4 + shadcn/ui
- **状态**: React Context + TanStack Query 5 + Dexie.js
- **后端**: Cloudflare Workers
- **部署**: Cloudflare Pages

## 开发计划

参见 [PRD.md](./PRD.md) 了解详细的产品需求文档和开发路线图。

## 许可证

MIT
