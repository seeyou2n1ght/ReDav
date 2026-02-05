/**
 * WebDAV 操作 Hook
 * 提供 ls（列出目录）和 cat（读取文件）两个操作，集成 TanStack Query 进行状态管理
 */

import { useQuery } from '@tanstack/react-query';
import { useWebDavClient } from './useWebDavClient';
import { listDirectory, readFile } from '../utils/webdav-client';
import { parseWebDAVXml } from '../utils/webdav-parser';
import type { AppConfig } from '../types';

/**
 * useWebDav Hook 返回类型
 */
export interface UseWebDavResult {
  /**
   * 列出目录内容
   * @param path - 目录路径（如 '/notes'）
   * @param options - 查询选项（如 enabled 是否启用查询）
   */
  ls: <T = typeof queryFn>(
    path: string,
    options?: { enabled?: boolean }
  ) => {
    data: ReturnType<typeof queryFn> | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };

  /**
   * 读取文件内容
   * @param path - 文件路径（如 '/notes/notes.json'）
   * @param options - 查询选项（如 enabled 是否启用查询）
   */
  cat: <T = typeof queryFn>(
    path: string,
    options?: { enabled?: boolean }
  ) => {
    data: T | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };
}

/**
 * WebDAV 操作 Hook
 * @param config - 应用配置（包含 WebDAV 和 Proxy 配置）
 * @returns 包含 ls 和 cat 操作的对象
 *
 * @example
 * ```tsx
 * const { webdav, proxy } = useAppConfig();
 * const webDav = useWebDav({ webdav, proxy });
 *
 * // 列出目录
 * const { data: items, isLoading, error } = webDav.ls('/notes');
 *
 * // 读取文件
 * const { data: content } = webDav.cat('/notes/notes.json');
 * ```
 */
export function useWebDav(config: AppConfig): UseWebDavResult {
  const client = useWebDavClient(config);

  // ls 操作：列出目录内容
  const ls = <T = ReturnType<typeof parseWebDAVXml>>(
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
  const cat = <T = string>(
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
