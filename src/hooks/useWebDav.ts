/**
 * WebDAV Query 配置生成
 * 提供 ls（列出目录）和 cat（读取文件）的 Query 配置，供调用者自行使用 useQuery
 */

import { useWebDavClient, type WebDAVConnectionConfig } from './useWebDavClient';
import { listDirectory, readFile } from '../utils/webdav-client';
import { parseWebDAVXml } from '../utils/webdav-parser';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { WebDAVItem } from '../types';

/**
 * 创建目录列表查询配置
 */
function createLsQueryOptions(
  client: ReturnType<typeof useWebDavClient>,
  config: WebDAVConnectionConfig,
  path: string
): UseQueryOptions<WebDAVItem[], Error> {
  return {
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
    staleTime: 60000,
    retry: 3,
  };
}

/**
 * 创建文件读取查询配置
 */
function createCatQueryOptions(
  client: ReturnType<typeof useWebDavClient>,
  config: WebDAVConnectionConfig,
  path: string
): UseQueryOptions<string, Error> {
  return {
    queryKey: ['webdav', 'cat', config.webdav.url, path],
    queryFn: async () => {
      return await readFile(
        client,
        config.webdav.url,
        path,
        config.proxy.url
      );
    },
    staleTime: 300000,
    retry: 3,
  };
}

/**
 * WebDAV Query 配置 Hook
 * @param config - WebDAV 连接配置
 * @returns 包含查询配置创建函数的对象
 *
 * @example
 * ```tsx
 * const { getLsOptions, getCatOptions } = useWebDavQuery(config);
 * 
 * // 在组件中使用
 * const { data: items } = useQuery(getLsOptions('/notes'));
 * const { data: content } = useQuery(getCatOptions('/notes/file.txt'));
 * ```
 */
export function useWebDavQuery(config: WebDAVConnectionConfig) {
  const client = useWebDavClient(config);

  return {
    /**
     * 获取目录列表查询配置
     */
    getLsOptions: (path: string) => createLsQueryOptions(client, config, path),
    
    /**
     * 获取文件读取查询配置
     */
    getCatOptions: (path: string) => createCatQueryOptions(client, config, path),
  };
}

// 为了向后兼容，保留旧名称的导出（但标记为废弃）
/** @deprecated 请使用 useWebDavQuery */
export const useWebDav = useWebDavQuery;
