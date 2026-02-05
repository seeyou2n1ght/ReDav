# 实现总结：useWebDav Hook

**最后更新**: 2025-02-05
**状态**: ✅ 已完成

## 实现概述

已成功实现 useWebDav Hook，支持 WebDAV 的 ls（列出目录）和 cat（读取文件）操作，并集成 TanStack Query 进行数据缓存和状态管理。

## 技术实现

### 1. 核心模块

#### utils/auth.ts
- **功能**: Basic Auth 编码工具函数
- **关键函数**: `encodeBasicAuth(username, password)`
- **实现**: 使用 `btoa()` 将 `username:password` 编码为 Base64

#### utils/webdav-parser.ts
- **功能**: 解析 WebDAV PROPFIND XML 响应
- **关键函数**: `parseWebDAVXml(xml: string): WebDAVItem[]`
- **实现**: 使用 DOMParser 解析 XML，提取文件/目录信息
- **解析字段**: href, displayname, getlastmodified, getcontentlength, resourcetype, etag

#### utils/webdav-client.ts
- **功能**: WebDAV 客户端，封装 HTTP 请求
- **关键函数**:
  - `createWebDAVClient(config: AppConfig): AxiosInstance`
  - `listDirectory(client, path, proxyUrl): Promise<string>`
  - `readFile(client, path, proxyUrl): Promise<string>`
- **实现**: 使用 axios 创建带认证头的实例，支持 Proxy 透传

#### hooks/useWebDavClient.ts
- **功能**: 管理 WebDAV 客户端实例
- **关键函数**: `useWebDavClient(config: AppConfig)`
- **实现**: 使用 useMemo 缓存 axios 实例，添加请求/响应拦截器

#### hooks/useWebDav.ts
- **功能**: 主 Hook，提供 ls 和 cat 操作
- **关键函数**: `useWebDav(path: string, config: AppConfig)`
- **返回值**: `{ ls, cat }`
  - `ls(path: string)`: useQuery hook，返回 WebDAVItem[]
  - `cat(path: string)`: useQuery hook，返回文件内容
- **集成**: 使用 TanStack Query 的 useQuery，支持自动缓存和状态管理

### 2. 架构设计

```
UI Components
    ↓
useWebDav Hook (TanStack Query)
    ↓
useWebDavClient Hook
    ↓
webdav-client.ts (axios)
    ↓
Proxy Server → WebDAV Server
    ↓
webdav-parser.ts (XML 解析)
    ↓
返回结构化数据
```

### 3. 依赖项

新增依赖：
- `@tanstack/react-query`: ^5.0.0 - 数据获取和状态管理
- `axios`: ^1.7.0 - HTTP 客户端

### 4. 修改文件

- `src/main.tsx`: 添加 QueryClientProvider
- `package.json`: 添加新依赖

### 5. 新增文件

- `src/utils/auth.ts` - Basic Auth 工具
- `src/utils/webdav-parser.ts` - XML 解析器
- `src/utils/webdav-client.ts` - WebDAV 客户端
- `src/hooks/useWebDavClient.ts` - 客户端管理 Hook
- `src/hooks/useWebDav.ts` - 主 Hook

## 功能特性

### 1. ls 操作（列出目录）

```typescript
const { ls } = useWebDav('/Books', config)
const { data: items, isLoading, error } = ls()

// items 格式: WebDAVItem[]
{
  href: string          // 文件路径
  displayName: string   // 文件名
  lastModified: Date    // 最后修改时间
  contentLength: number // 文件大小（字节）
  isDirectory: boolean  // 是否为目录
  etag?: string         // ETag
}
```

### 2. cat 操作（读取文件）

```typescript
const { cat } = useWebDav('/Books/note.json', config)
const { data: content, isLoading, error } = cat()

// content: string - 文件原始内容
```

### 3. TanStack Query 集成

- **自动缓存**: 避免重复请求相同内容
- **重试机制**: 默认重试 3 次
- **状态管理**: 提供 isLoading、error、data 等状态
- **缓存策略**: 默认数据新鲜时间为 1 分钟

### 4. Proxy 透传

所有请求通过 Proxy 服务器，避免浏览器 CORS 限制：

```
请求流程：
前端 → Proxy?target={webdav-url} → WebDAV 服务器
         ↓ (添加认证头)
Authorization: Basic <base64>
X-Proxy-Auth: <token> (可选)
```

## 错误处理

### WebDAVError 类

```typescript
class WebDAVError extends Error {
  statusCode?: number    // HTTP 状态码
  response?: any         // 响应数据
}
```

### 错误场景

- **401**: 认证失败（用户名/密码错误）
- **403**: 禁止访问（Proxy Token 错误）
- **404**: 文件/目录不存在
- **500**: 服务器错误
- **网络错误**: 连接超时等

## 使用示例

```typescript
import { useWebDav } from './hooks/useWebDav'
import type { AppConfig } from './types'

function BookList() {
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

  const { ls } = useWebDav('/Books', config)
  const { data: books, isLoading, error } = ls()

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <ul>
      {books?.map(book => (
        <li key={book.href}>
          {book.displayName} ({book.isDirectory ? '目录' : '文件'})
        </li>
      ))}
    </ul>
  )
}
```

## 测试建议

### 单元测试

- `auth.ts`: 测试 Basic Auth 编码
- `webdav-parser.ts`: 测试 XML 解析（使用示例 XML）
- `webdav-client.ts`: Mock axios 测试请求构建
- `useWebDavClient.ts`: 测试 Hook 返回值
- `useWebDav.ts`: 使用 React Testing Library 测试 Hook

### 集成测试

- 连接真实 WebDAV 服务器测试 ls/cat 操作
- 测试 Proxy 透传功能
- 测试错误场景（认证失败、文件不存在等）

## 性能优化

1. **客户端缓存**: useWebDavClient 使用 useMemo 缓存 axios 实例
2. **查询缓存**: TanStack Query 自动缓存请求结果
3. **请求去重**: TanStack Query 自动合并相同请求
4. **内存管理**: 组件卸载时自动取消未完成请求

## 下一步计划

1. **实现 Proxy** (`functions/proxy.ts`)
   - 处理 CORS
   - 透传 Basic Auth
   - 支持 X-Proxy-Auth 保护

2. **实现阅读器适配器**
   - AnxReader 适配器（解析 JSON）
   - MoonReader 适配器（解析 .po 文件）

3. **UI 开发**
   - 配置界面（WebDAV 设置）
   - 网格书架视图
   - 笔记流视图

## 注意事项

1. **只读原则**: ReDav 永远不会修改用户 WebDAV 上的原始文件
2. **无服务端存储**: 所有配置和数据缓存都在浏览器端
3. **类型安全**: 严格的 TypeScript 类型检查
4. **错误处理**: 统一的错误处理和用户友好的错误消息
