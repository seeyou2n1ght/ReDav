# ReDav 技术规格说明书 (SPEC)

## 1. 系统架构

ReDav 采用 **Local-First (本地优先)** + **BFF (Backend for Frontend)** 架构。

### 1.1 顶层设计
```mermaid
graph TD
    User[用户] --> Frontend[ReDav UI (Vite + React)]
    Frontend -->|WebDAV API (XML/Binary)| Proxy[ReDav Proxy (Cloudflare Worker)]
    Proxy -->|透传请求| WebDAV[用户 WebDAV Server]
    Frontend -->|IndexedDB| LocalDB[本地数据库]
    
    subgraph "Edge Network (Cloudflare)"
        Proxy
    end
    
    subgraph "Browser"
        Frontend
        LocalDB
    end
```

### 1.2 核心模块

| 模块 | 职责 | 关键技术 |
|------|------|----------|
| **App Shell** | 路由、布局、全局状态 | React Router, Tailwind CSS, shadcn/ui |
| **Logic Layer** | 数据聚合、状态管理 | TanStack Query, React Context |
| **Data Layer** | WebDAV 通信、数据缓存 | axios, xml-js, Dexie.js |
| **Adapters** | 特定格式解析 | sql.js, pako |
| **Proxy** | CORS 处理、鉴权透传 | Cloudflare Workers |

## 2. 数据流

### 2.1 初始化流程
1. 用户输入 WebDAV 地址/账号/密码。
2. 验证连接 (PROPFIND /)。
3. 保存配置到 IndexedDB (敏感信息存储策略待定，目前明文存储在 LocalStorage/IndexedDB)。

### 2.2 数据同步流程
1. **List**: `useLibrary` 并行请求所有启用 Reader 的根目录。
2. **Match**: 根据 `adapters` 中的正则匹配文件 (如 `^database7\.db$`, `\.an$`)。
3. **Diff**: 比较 `Last-Modified` 或 `ETag` (目前全量拉取，增量更新在 Roadmap 中)。
4. **Fetch**: 通过 Proxy 下载文件 Blob/Buffer。
5. **Parse**:
    - **AnxReader**: 启动 `sql.js` WASM -> 读取 `tb_notes/tb_books` -> 转换为 `UnifiedNote`。
    - **MoonReader**: `pako.inflate` 解压 -> 二进制/文本解析 -> 提取高亮/笔记。
6. **Aggregate**: 合并所有来源的笔记 -> 按时间排序 -> 生成 `UnifiedBook` 列表。
7. **Render**: 更新 UI。

## 3. 接口规范

### 3.1 统一笔记模型 (Unified Model)

所有适配器必须输出以下标准格式：

```typescript
interface UnifiedNote {
  id: string;           // 唯一 ID (由适配器生成，通常是 originId 的 hash)
  bookTitle: string;    // 书名
  author?: string;      // 作者
  chapter?: string;     // 章节标题
  content: string;      // 高亮内容 (原书文本)
  reader_note?: string; // 用户笔记/感想
  page?: number;        // 页码/百分比
  createdAt: Date;      // 创建时间
  sourceApp: string;    // 'AnxReader' | 'MoonReader' | ...
  rawData?: any;        // 原始数据备份
}

interface UnifiedBook {
  title: string;
  author?: string;
  coverUrl?: string;    // 封面图片 URL (WebDAV 路径)
  lastReading: Date;    // 最近阅读时间
  noteCount: number;    // 笔记数量
  sourceApps: string[]; // 来源应用列表
}
```

### 3.2 适配器接口

```typescript
interface ReaderAdapter {
  name: string;        // 显示名称
  type: ReaderType;    // 枚举类型标识
  filePattern: RegExp; // 文件名匹配规则
  
  // 解析函数：输入 ArrayBuffer + 文件名，输出笔记列表
  parse(buffer: ArrayBuffer, filename: string): Promise<UnifiedNote[]>;
}
```

## 4. 关键技术细节

### 4.1 SQL.js 集成 (AnxReader)
- **问题**: sql.js 需要加载 1MB+ 的 `sql-wasm.wasm`。
- **方案**:
  - `sqlite-loader.ts` 实现单例模式。
  - 使用 `import('sql.js')` 动态导入，避免阻塞首屏。
  - 生产环境需配置 `locateFile` 指向 CDN 或本地静态资源。

### 4.2 WebDAV 兼容性
- **问题**: 不同 WebDAV Server (坚果云, Nextcloud, Nginx) 返回的 XML 命名空间不一致。
- **方案**: `webdav-parser.ts` 实现多重降级策略 (Standard NS -> No NS -> `d:` prefix -> `D:` prefix)。

### 4.3 代理服务
- **路径**: `/api/proxy` (Cloudflare Pages Functions 路由)。
- **参数**: `?target=<Target_URL>`。
- **鉴权**:
  - `Authorization`: 透传 WebDAV Basic Auth。
  - `X-Proxy-Auth`: (可选) 保护 Proxy 服务本身。

## 5. 项目结构规范

```bash
src/
├── adapters/       # [核心] 阅读器适配器实现
├── components/     # UI 组件 (Presentational)
├── hooks/          # 逻辑钩子 (Container/Logic)
│   ├── useLibrary.ts # 数据聚合主逻辑
│   └── useConfig.ts  # 全局配置
├── pages/          # 页面级组件
├── types/          # TypeScript 类型定义
└── utils/          #通用工具 (WebDAV Client, Parser)
```

## 6. 构建与部署

- **Build Tool**: Vite
- **Target**: ESNext (因使用了 Top-level await 和 WASM)
- **Platform**: Cloudflare Pages
  - Build Command: `npm run build`
  - Output Directory: `dist`
