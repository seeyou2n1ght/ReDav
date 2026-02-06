/**
 * AnxReader 数据获取 Hook
 * 整合 WebDAV 下载、SQLite 解析和 IndexedDB 缓存
 */

import { useQuery } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { parseAnxDatabase, type AnxReaderResult } from '../adapters/anx-reader';

/**
 * 数据库文件名
 */
const DATABASE_FILENAME = 'database7.db';

/**
 * 通过 Proxy 下载 AnxReader 数据库
 * @param webdavUrl - WebDAV 基础 URL
 * @param syncPath - 同步路径（如 /AnxReader）
 * @param proxyUrl - Proxy 服务器地址
 * @param auth - Basic Auth 凭证
 */
async function fetchDatabase(
    webdavUrl: string,
    syncPath: string,
    proxyUrl: string,
    auth: { username: string; password: string },
    proxyToken?: string
): Promise<ArrayBuffer> {
    // 构建数据库完整 URL
    const dbPath = syncPath.endsWith('/')
        ? `${syncPath}${DATABASE_FILENAME}`
        : `${syncPath}/${DATABASE_FILENAME}`;
    const targetUrl = webdavUrl + dbPath;

    // 通过 Proxy 请求
    const proxyEndpoint = `${proxyUrl.replace(/\/$/, '')}/proxy?target=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyEndpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa(`${auth.username}:${auth.password}`)}`,
            ...(proxyToken ? { 'X-Proxy-Auth': proxyToken } : {}),
        },
    });

    if (!response.ok) {
        throw new Error(`下载数据库失败: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
}

/**
 * useAnxReader Hook
 * 获取并解析 AnxReader 笔记数据
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAnxReader();
 * if (data) {
 *   console.log(`共 ${data.books.length} 本书，${data.notes.length} 条笔记`);
 * }
 * ```
 */
export function useAnxReader() {
    const { config } = useConfig();

    // 获取 AnxReader 配置
    const anxConfig = config?.readers?.anxReader;
    const proxyConfig = config?.proxy;

    const enabled = Boolean(
        anxConfig?.enabled &&
        anxConfig?.webdav?.url &&
        proxyConfig?.url
    );

    return useQuery<AnxReaderResult>({
        queryKey: ['anxReader', 'database', anxConfig?.webdav?.url, anxConfig?.syncPath],
        queryFn: async () => {
            if (!anxConfig || !proxyConfig) {
                throw new Error('AnxReader 未配置');
            }

            // 1. 下载数据库
            const buffer = await fetchDatabase(
                anxConfig.webdav.url,
                anxConfig.syncPath,
                proxyConfig.url,
                {
                    username: anxConfig.webdav.username,
                    password: anxConfig.webdav.password,
                },
                proxyConfig.token
            );

            // 2. 解析数据库
            const result = await parseAnxDatabase(buffer);

            return result;
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 分钟内数据视为新鲜
        retry: 2,
    });
}
