/**
 * WebDAV 客户端 Hook
 * 管理 WebDAV 客户端实例和配置
 */

import { useMemo } from 'react';
import { createWebDAVClient } from '../utils/webdav-client';
import type { AppConfig } from '../types';

/**
 * 创建并管理 WebDAV 客户端实例
 * @param config - 应用配置（包含 WebDAV 和 Proxy 配置）
 * @returns axios 实例
 *
 * @example
 * ```tsx
 * const { webdav, proxy } = useAppConfig();
 * const client = useWebDavClient({ webdav, proxy });
 * ```
 */
export function useWebDavClient(config: AppConfig) {
  // 使用 useMemo 缓存客户端实例，避免配置不变时重复创建
  const client = useMemo(() => {
    return createWebDAVClient(config);
  }, [config]);

  return client;
}
