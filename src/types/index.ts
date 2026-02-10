/**
 * 全局类型定义
 */

/**
 * 支持的阅读器类型
 */
export type ReaderType = 'anxReader' | 'moonReader' | 'koReader';

/**
 * 阅读器元信息
 */
export interface ReaderMeta {
  name: string;
  icon: string;
  defaultPath: string;
}

/**
 * 阅读器默认配置
 */
export const READER_DEFAULTS: Record<ReaderType, ReaderMeta> = {
  anxReader: {
    name: 'AnxReader',
    icon: '📚',
    defaultPath: '/AnxReader',
  },
  moonReader: {
    name: 'MoonReader (静读天下)',
    icon: '🌙',
    defaultPath: '/Books',
  },
  koReader: {
    name: 'KOReader',
    icon: '📖',
    defaultPath: '/koreader',
  },
};

/**
 * WebDAV 配置
 */
export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

/**
 * 单个阅读器配置
 */
export interface ReaderConfig {
  enabled: boolean;
  webdav: WebDAVConfig;
  syncPath: string;
}

/**
 * Proxy 配置
 */
export interface ProxyConfig {
  url: string;
  token?: string;
}

/**
 * 应用配置（重构后）
 */
export interface AppConfig {
  readers: Partial<Record<ReaderType, ReaderConfig>>;
  proxy: ProxyConfig;
}

/**
 * WebDAV 文件/目录项
 */
export interface WebDAVItem {
  filename: string;
  basename: string;
  lastmod: string;
  size: number;
  type: 'file' | 'directory';
  etag?: string;
}


export interface UnifiedBook {
  title: string;
  author?: string;
  noteCount: number;
  lastReading?: Date;
  coverUrl?: string;
  sourceApps: string[];
}

/**
 * 统一笔记格式
 */
export interface UnifiedNote {
  /** 唯一标识 */
  id: string;
  /** 书名 */
  bookTitle: string;
  /** 章节 */
  chapter?: string;
  /** 高亮内容 */
  highlight: string;
  /** 用户笔记 */
  note?: string;
  /** 页码/位置 */
  page?: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt?: Date;
  /** 来源应用 */
  sourceApp: string;
  /** 原始数据（调试用） */
  rawData?: unknown;
}

