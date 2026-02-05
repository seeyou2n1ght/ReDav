# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 项目概述

ReDav 是一个纯前端、无状态的阅读笔记聚合工具，支持从 WebDAV 网盘读取不同阅读应用（AnxReader、MoonReader 等）的笔记并统一展示。项目采用 React + TypeScript + Vite 构建，部署在 Cloudflare Pages 上。

**核心理念**：
- 数据自主：笔记永远存储在用户自己的 WebDAV 中，ReDav 只是只读的"眼镜"
- 解耦架构：UI 与代理服务分离，支持多种部署模式（官方托管、自部署 UI、自部署代理）
- 本地优先：无账户系统，配置存储在浏览器 IndexedDB/LocalStorage

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器（端口默认 5173）
npm run dev

# 构建生产版本（输出到 dist/）
npm run build

# 运行 ESLint 代码检查
npm run lint

# 预览构建结果
npm run preview
```

## 代码架构

### 1. 前后端分离架构

项目采用前后端分离设计，但部署在同一仓库：

- **前端**（`src/`）：React SPA，负责 UI 展示和用户交互
- **后端代理**（`functions/proxy.ts`）：Cloudflare Pages Function，处理 WebDAV 请求的 CORS 和认证透传

**部署模式**：
- SaaS 模式：官方托管 UI + 官方公共 Proxy
- 混合模式：用户自部署 UI + 自定义 Proxy
- 极客模式：用户自部署 UI + 用户自部署 Proxy

### 2. 适配器模式（核心设计）

系统通过适配器模式统一处理不同阅读器的私有格式：

**核心接口**（`src/adapters/types.ts`）：
```typescript
interface ReaderAdapter {
  name: string;                    // 阅读器名称
  filePattern: RegExp;             // 文件匹配规则（如 /\.json$/）
  parse(content: string): UnifiedNote[];
}

interface UnifiedNote {
  id: string;
  bookTitle: string;
  chapter?: string;
  highlight: string;
  note?: string;
  page?: number;
  createdAt: Date;
  sourceApp: string;
}
```

**适配器注册机制**（`src/adapters/index.ts`）：
- 适配器通过 `registerAdapter()` 动态注册到全局适配器数组
- `parseNotes(filename, content)` 根据文件名自动选择适配器并解析
- 新增阅读器支持只需创建适配器文件并注册，零侵入现有代码

**现有适配器**：
- `anx-reader.ts`：解析 AnxReader 的 JSON 格式
- `moon-reader.ts`：解析 MoonReader（静读天下）的 .po 文件格式

### 3. WebDAV 代理机制

**代理功能**（`functions/proxy.ts`）：
- 接收前端请求，透传 WebDAV 的 Basic Auth 认证
- 支持可选的 `X-Proxy-Auth` 头进行代理层安全验证（通过 `PROXY_TOKEN` 环境变量配置）
- 自动添加 CORS 头（`Access-Control-Allow-Origin: *`）
- 错误处理标准化，返回 `{ error, message }` 格式

**前端调用流程**：
1. 用户在 UI 配置 WebDAV 地址和凭证（存储在浏览器本地）
2. 前端通过 Proxy URL（默认可用官方代理）发起请求
3. 代理透传认证信息到用户 WebDAV 服务器
4. 返回数据经适配器解析为统一格式展示

### 4. 状态管理策略

项目采用轻量级状态管理方案：

- **配置状态**：React Context + useReducer（`AppConfig` 包含 webdav 和 proxy 配置）
- **网络状态**：TanStack Query 5（处理 WebDAV 文件列表和内容的异步获取）
- **本地缓存**：Dexie.js（IndexedDB 封装，用于缓存笔记数据，支持离线访问）

### 5. 项目结构说明

```
src/
├── adapters/          # 阅读器适配器（核心扩展点）
│   ├── types.ts      # 适配器接口定义
│   ├── index.ts      # 适配器注册和分发逻辑
│   ├── anx-reader.ts # AnxReader JSON 格式解析
│   └── moon-reader.ts # MoonReader .po 格式解析
├── components/       # UI 组件（使用 shadcn/ui）
├── hooks/           # 自定义 Hooks（如 useWebDav）
├── types/           # 全局类型定义（WebDAV 配置、文件项等）
├── utils/           # 工具函数（XML 解析、日期处理等）
└── assets/          # 静态资源

functions/
└── proxy.ts         # Cloudflare Pages Function（WebDAV 代理）
```

## 关键技术栈

- **前端框架**：React 18 + Vite 5 + TypeScript 5
- **UI 库**：Tailwind CSS 4 + shadcn/ui 组件
- **HTTP 客户端**：axios
- **状态管理**：React Context + TanStack Query 5 + Dexie.js
- **部署平台**：Cloudflare Pages（前端 + Functions）
- **代码质量**：ESLint 9 + TypeScript ESLint

## 开发注意事项

1. **只读原则**：ReDav 永远不会修改用户 WebDAV 上的原始文件，所有操作都是只读的
2. **无服务端存储**：官方 Proxy 不缓存任何用户笔记内容，所有数据直接透传
3. **适配器扩展**：新增阅读器支持时，只需实现 `ReaderAdapter` 接口并注册，无需修改其他代码
4. **类型安全**：项目使用严格 TypeScript 配置，确保类型定义与实际代码同步更新
5. **跨域处理**：所有 WebDAV 请求必须通过 Proxy，避免浏览器 CORS 限制
6. **环境变量**：Cloudflare Workers 通过 `Env` 接口读取环境变量（如 `PROXY_TOKEN`）
