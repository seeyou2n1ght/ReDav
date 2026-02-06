/**
 * WebDAV 操作 Hook
 * 提供 ls（列出目录）和 cat（读取文件）两个操作，集成 TanStack Query 进行状态管理
 */

import { useQuery } from '@tanstack/react-query';
import { useWebDavClient, type WebDAVConnectionConfig } from './useWebDavClient';
import { listDirectory, readFile } from '../utils/webdav-client';
import { parseWebDAVXml } from '../utils/webdav-parser';

/**
 * WebDAV 操作 Hook
 * @param config - WebDAV 连接配置（包含 webdav 和 proxy 配置）
 * @returns 包含 ls 和 cat 操作的对象
 *
 * @example
 * ```tsx
 * // 从 AppConfig 中提取单个阅读器的配置
 * const readerConfig = config.readers.anxReader;
 * const connectionConfig = {
 *   webdav: readerConfig.webdav,
 *   proxy: config.proxy,
 * };
 * const webDav = useWebDav(connectionConfig);
 *
 * // 列出目录
 * const { data: items, isLoading, error } = webDav.ls('/notes');
 *
 * // 读取文件
 * const { data: content } = webDav.cat('/notes/notes.json');
 * ```
 */
export function useWebDav(config: WebDAVConnectionConfig) {
  const client = useWebDavClient(config);

  // ls 操作：列出目录内容
  const ls = (
    path: string,
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: ['webdav', 'ls', config.webdav.url, path],
      queryFn: async () => {
        const xml = await listDirectory(
          client,
          config.webdav.url,
          path,
          config.proxy.url
        );
        return parseWebDAVXml(xml);
      },
      enabled: options?.enabled ?? true,
      staleTime: 60000, // 1 分钟内数据视为新鲜，不会重新获取
      retry: 3, // 失败时重试 3 次
    });
  };

  // cat 操作：读取文件内容
  const cat = (
    path: string,
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: ['webdav', 'cat', config.webdav.url, path],
      queryFn: async () => {
        return await readFile(
          client,
          config.webdav.url,
          path,
          config.proxy.url
        );
      },
      enabled: options?.enabled ?? true,
      staleTime: 300000, // 5 分钟内数据视为新鲜
      retry: 3, // 失败时重试 3 次
    });
  };

  return { ls, cat };
}
