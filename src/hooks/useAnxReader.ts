/**
 * AnxReader 数据获取 Hook
 * 整合 WebDAV 下载、SQLite 解析和 IndexedDB 缓存
 * 支持基于 ETag/Last-Modified 的增量同步
 */

import { useQuery } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { parseAnxDatabase, type AnxReaderResult } from '../adapters/anx-reader';
import { getCachedData, saveToCache, needsUpdate } from '../utils/anx-cache';

/**
 * 数据库文件名
 */
const DATABASE_FILENAME = 'database7.db';

/**
 * 通过 Proxy 获取数据库 ETag（HEAD 请求）
 */
async function fetchDatabaseEtag(
    webdavUrl: string,
    syncPath: string,
    proxyUrl: string,
    auth: { username: string; password: string },
    proxyToken?: string
): Promise<string> {
    const dbPath = syncPath.endsWith('/')
        ? `${syncPath}${DATABASE_FILENAME}`
        : `${syncPath}/${DATABASE_FILENAME}`;
    const targetUrl = webdavUrl + dbPath;
    const proxyEndpoint = `${proxyUrl.replace(/\/$/, '')}/proxy?target=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyEndpoint, {
        method: 'HEAD',
        headers: {
            'Authorization': `Basic ${btoa(`${auth.username}:${auth.password}`)}`,
            ...(proxyToken ? { 'X-Proxy-Auth': proxyToken } : {}),
        },
    });

    if (!response.ok) {
        throw new Error(`获取 ETag 失败: ${response.status}`);
    }

    // 优先使用 ETag，其次使用 Last-Modified
    const etag = response.headers.get('ETag') ||
        response.headers.get('Last-Modified') ||
        Date.now().toString();

    return etag;
}

/**
 * 通过 Proxy 下载 AnxReader 数据库
 */
async function fetchDatabase(
    webdavUrl: string,
    syncPath: string,
    proxyUrl: string,
    auth: { username: string; password: string },
    proxyToken?: string
): Promise<{ buffer: ArrayBuffer; etag: string }> {
    const dbPath = syncPath.endsWith('/')
        ? `${syncPath}${DATABASE_FILENAME}`
        : `${syncPath}/${DATABASE_FILENAME}`;
    const targetUrl = webdavUrl + dbPath;
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

    const etag = response.headers.get('ETag') ||
        response.headers.get('Last-Modified') ||
        Date.now().toString();

    return {
        buffer: await response.arrayBuffer(),
        etag,
    };
}

/**
 * useAnxReader Hook
 * 获取并解析 AnxReader 笔记数据，支持增量同步缓存
 */
export function useAnxReader() {
    const { config } = useConfig();

    const anxConfig = config?.readers?.anxReader;
    const proxyConfig = config?.proxy;

    const enabled = Boolean(
        anxConfig?.enabled &&
        anxConfig?.webdav?.url &&
        proxyConfig?.url
    );

    return useQuery<AnxReaderResult & { fromCache: boolean }>({
        queryKey: ['anxReader', 'database', anxConfig?.webdav?.url, anxConfig?.syncPath],
        queryFn: async () => {
            if (!anxConfig || !proxyConfig) {
                throw new Error('AnxReader 未配置');
            }

            const auth = {
                username: anxConfig.webdav.username,
                password: anxConfig.webdav.password,
            };

            // 1. 获取远程 ETag
            const remoteEtag = await fetchDatabaseEtag(
                anxConfig.webdav.url,
                anxConfig.syncPath,
                proxyConfig.url,
                auth,
                proxyConfig.token
            );

            // 2. 检查是否需要更新
            const shouldUpdate = await needsUpdate(remoteEtag);

            if (!shouldUpdate) {
                // 使用缓存
                const cached = await getCachedData();
                if (cached) {
                    // console.debug('[AnxReader] 使用缓存数据');
                    return {
                        books: cached.books,
                        notes: cached.notes,
                        fromCache: true,
                    };
                }
            }

            // 3. 下载并解析数据库
            // console.debug('[AnxReader] 下载新数据...');
            const { buffer, etag } = await fetchDatabase(
                anxConfig.webdav.url,
                anxConfig.syncPath,
                proxyConfig.url,
                auth,
                proxyConfig.token
            );

            const result = await parseAnxDatabase(buffer);

            // 4. 保存到缓存
            await saveToCache(etag, result.books, result.notes);
            // console.debug('[AnxReader] 数据已缓存');

            return {
                ...result,
                fromCache: false,
            };
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 分钟
        retry: 2,
    });
}
