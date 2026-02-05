/**
 * 全局类型定义
 */

/**
 * WebDAV 配置
 */
export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

/**
 * Proxy 配置
 */
export interface ProxyConfig {
  url: string;
  token?: string;
}

/**
 * 应用配置
 */
export interface AppConfig {
  webdav: WebDAVConfig;
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
