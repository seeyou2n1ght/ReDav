产品需求文档 (PRD): ReDav

    Project Name: ReDav Slogan: "Re-read your journey. Your private Readwise on WebDAV." Type: Local-First, Serverless, Privacy-Focused.

1. 产品概述 (Overview)
1.1 背景

用户在使用 AnxReader、静读天下（Moon+ Reader）等应用阅读时产生的高价值笔记通常沉睡在 WebDAV 网盘中。目前的解决方案要么极其昂贵且封闭（Readwise），要么部署繁琐（Docker/NAS）。ReDav 旨在提供一个纯前端、无状态、可一键部署的轻量级笔记聚合工具。
1.2 核心价值

    数据自主 (Data Ownership): 用户的笔记永远躺在自己的 WebDAV 里，ReDav 只是一个即用即走的“眼镜”。

    解耦架构 (Decoupled): UI 与 代理服务分离。用户可自由组合“官方托管 UI”、“自建 UI”、“自建代理”。

    统一体验 (Unified): 将不同阅读器的私有格式统一清洗为标准化的阅读卡片。

2. 架构与部署 (Architecture)

系统由 Frontend (ReDav UI) 和 Backend (ReDav Proxy) 两部分组成。
2.1 部署模式矩阵
模式	Frontend (Vercel/Pages)	Proxy (Workers/Docker)	场景
SaaS 模式	官方托管 (redav.app)	官方公共 Proxy	小白用户，开箱即用
混合模式	用户自部署	自定义填入 (支持 Auth)	担心官方前端停更，但不想折腾后端
极客模式	用户自部署	用户自部署	极致隐私，完全掌控
2.2 用户配置 (Settings)

用户在前端需配置两组信息：

    数据源 (Source): WebDAV 地址、账号、密码。

    连接管道 (Pipeline):

        Proxy URL: 默认为官方 API，可修改为用户自建的 Worker 地址。

        Proxy Token: (可选) 若自建 Proxy 开启了鉴权，在此填入。

3. 施工路线图 (Roadmap)
🟢 已实现 (Phase 0: Concept)

    [x] 核心技术选型 (React + Vite + Cloudflare Workers + Cloudflare).

    [x] 架构设计 (BFF / Local-First).

    [x] 产品命名 (ReDav).

🟡 施工中 (Phase 1: MVP)

    基础设施

        [ ] 初始化项目代码结构（Vite + React + TypeScript）。

        [ ] 实现 Proxy：处理 CORS，透传 Basic Auth，支持 X-Proxy-Auth 保护。

        [ ] 封装 useWebDav Hook：实现 XML 解析，支持 ls/cat 操作。

    核心业务

        [ ] AnxReader 适配器：解析 JSON 提取高亮与笔记。

        [ ] MoonReader(静读天下)适配器：解析 .po 文件提取阅读进度。

        [ ] UI 构建：实现“网格书架”与“笔记流”视图 (shadcn/ui)。

    基础导出

        [ ] 复制为 Markdown。

        [ ] 生成 JSON 备份。

🟡 计划中 (Phase 2: Enriched)

    KOReader 支持：解析 .lua 格式笔记 (高优)。

    Obsidian Sync：利用 Chrome File System Access API 直写本地 Vault。

    分享卡片：前端生成精美高亮图片。

    增量更新：基于 Last-Modified 缓存策略，减少带宽消耗。

🔴 不会做 (Out of Scope)

    ❌ 双向同步：ReDav 永远是只读 (Read-Only) 的，绝不修改用户 WebDAV 上的原始文件，防止损坏书籍数据。

    ❌ 用户账户系统：无登录，无注册。所有配置存储在浏览器 IndexedDB/LocalStorage。

    ❌ 原文阅读：不提供 EPUB/PDF 阅读功能，仅展示笔记。

    ❌ 服务端存储：官方 Proxy 绝不缓存用户笔记内容。

4. 技术栈 (Tech Stack)

    开发环境: Node.js 18+, pnpm (推荐) 或 npm

    Frontend: React 18, Vite 5, TypeScript 5.

    UI: Tailwind CSS 4, shadcn/ui, Lucide Icons.

    State: React Context + useReducer (配置), TanStack Query 5 (网络), Dexie.js (本地缓存).

    HTTP Client: axios.

    Backend: 原生 Cloudflare Workers (Edge Runtime).

    Build: Cloudflare Pages (Frontend & Functions).

    Test: Vitest 1, React Testing Library 14.

    Lint: ESLint 8, Prettier 3, Husky 8.

4.1 项目结构 (Project Structure)

    采用简单结构，前后端同仓库，利用 Cloudflare Pages Functions 原生集成：

    redav/
    ├── src/                        # 前端代码
    │   ├── components/            # UI 组件
    │   ├── hooks/                 # 自定义 Hooks (useWebDav)
    │   ├── adapters/              # 阅读器适配器
    │   │   ├── index.ts          # 统一导出 + 自动分发
    │   │   ├── types.ts          # 适配器接口定义
    │   │   ├── anx-reader.ts     # AnxReader 适配器
    │   │   └── moon-reader.ts    # MoonReader(静读天下)适配器
    │   ├── utils/                 # 工具函数
    │   └── types/                 # 类型定义
    │
    ├── functions/                  # Cloudflare Pages Functions
    │   └── proxy.ts               # WebDAV 代理
    │
    ├── public/                    # 静态资源
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    └── wrangler.toml              # Cloudflare 配置

4.2 适配器设计 (Adapter Pattern)

    采用适配器模式统一处理不同阅读器的笔记格式：

    统一接口定义：
    interface ReaderAdapter {
      name: string;                // 阅读器名称
      filePattern: RegExp;         // 文件匹配规则
      parse(content: string): UnifiedNote[];
    }

    统一笔记格式：
    interface UnifiedNote {
      id: string;                  // 唯一标识
      bookTitle: string;           // 书名
      chapter?: string;            // 章节
      highlight: string;           // 高亮内容
      note?: string;               // 用户笔记
      page?: number;               // 页码/位置
      createdAt: Date;             // 创建时间
      sourceApp: string;           // 来源应用
    }

    扩展方式：新增阅读器支持只需创建适配器文件并注册到 adapters/index.ts，零侵入现有代码。

5. 自定义代理接口规范 (Proxy API Spec)

若用户选择自建后端（如使用 Python/Go/Node 部署在自己的 VPS 上），需遵循此接口规范以便前端连接。

Endpoint: GET /proxy

Request:
HTTP

GET /proxy?target=https://dav.nas.com/Books/History/Sapiens.json HTTP/1.1
Authorization: Basic <WebDAV_User_Pass_Base64>
X-Proxy-Auth: <Optional_Security_Token_For_Your_Proxy>

Behavior:

    验证 X-Proxy-Auth (如果设置了)。

    向 target 发起请求，透传 Authorization 头。

    收到响应后，移除可能导致跨域的头。

    添加 CORS 头：

        Access-Control-Allow-Origin: * (或前端域名)

        Access-Control-Allow-Headers: Authorization, X-Proxy-Auth

Response:

    成功：直接返回目标文件的 Body (XML/JSON/Text)，状态码 200。

    错误响应格式：
    {
      "error": "错误类型",
      "message": "详细错误信息"
    }

    常见错误状态码：
    - 400: 请求参数错误（缺少 target 参数）
    - 401: 认证失败（Proxy Token 错误或 WebDAV 认证失败）
    - 403: 禁止访问（X-Proxy-Auth 验证失败）
    - 502: 上游服务器错误（WebDAV 服务器无响应）