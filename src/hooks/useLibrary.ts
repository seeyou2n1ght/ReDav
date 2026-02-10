/**
 * 核心数据聚合 Hook
 * 从所有启用的阅读器获取数据，并解析为统一格式
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { createWebDAVClient, listDirectory, readFile } from '../utils/webdav-client';
import { parseWebDAVXml } from '../utils/webdav-parser';
import { getRegisteredAdapters } from '../adapters';
import type { UnifiedNote, ReaderType, ReaderConfig, UnifiedBook, WebDAVItem } from '../types';

/**
 * 库数据接口
 */
export interface LibraryData {
    books: UnifiedBook[];
    notes: UnifiedNote[];
    isLoading: boolean;
    errors: Error[];
    refresh: () => void;
}

export function useLibrary(): LibraryData {
    const { config: appConfig, isLoading: isConfigLoading } = useConfig();

    // 1. 获取所有启用的阅读器配置
    const enabledReaders = useMemo(() => {
        if (!appConfig?.readers) return [];
        const readers = Object.entries(appConfig.readers)
            .filter(([, cfg]) => cfg?.enabled)
            .map(([type, cfg]) => ({
                type: type as ReaderType,
                readerConfig: cfg as ReaderConfig,
                // 为每个阅读器创建独立的客户端
                client: createWebDAVClient({
                    webdav: cfg!.webdav,
                    proxy: appConfig.proxy,
                }),
            }));
        return readers;
    }, [appConfig, isConfigLoading]);

    // 2. 并行获取每个阅读器的目录列表
    const listQueries = useQueries({
        queries: enabledReaders.map(({ type, readerConfig, client }) => ({
            queryKey: ['library', 'ls', type, readerConfig.webdav.url, readerConfig.syncPath],
            queryFn: async () => {
                try {
                    let xml = await listDirectory(
                        client,
                        readerConfig.webdav.url,
                        readerConfig.syncPath,
                        appConfig?.proxy.url || ''
                    );

                    let items = parseWebDAVXml(xml);

                    // AnxReader 特殊处理：如果根目录下没有 database7.db 但有 anx 目录，则深入查找
                    if (type === 'anxReader' && !items.some(i => i.basename === 'database7.db')) {
                        const anxDir = items.find(i => i.basename === 'anx' && i.type === 'directory');
                        if (anxDir) {
                            // 构造新的探测路径
                            // WebDAV 路径通常是 href，我们需要基于 syncPath 确保路径更正确，
                            // 但 listDirectory 使用的是相对于 webdav.url 的路径或绝对路径。
                            // 简单起见，我们尝试使用 /anx 后缀
                            const subPath = readerConfig.syncPath.endsWith('/')
                                ? `${readerConfig.syncPath}anx`
                                : `${readerConfig.syncPath}/anx`;

                            xml = await listDirectory(
                                client,
                                readerConfig.webdav.url,
                                subPath,
                                appConfig?.proxy.url || ''
                            );
                            items = parseWebDAVXml(xml);
                        }
                    }

                    return { type, readerConfig, items };
                } catch (e) {
                    throw e;
                }
            },
            staleTime: 60 * 1000, // 1分钟
            enabled: !!appConfig,
        })),
    });

    // 3. 筛选出需要下载的文件
    const filesToDownload = useMemo(() => {
        if (!appConfig) return [];

        const tasks: Array<{
            readerType: ReaderType;
            fileItem: WebDAVItem;
            client: any; // AxiosInstance
            proxyUrl: string;
            webdavUrl: string;
            syncPath: string;
        }> = [];

        listQueries.forEach((query, index) => {
            if (!query.data) return;
            const { type, readerConfig, items } = query.data;
            const { client } = enabledReaders[index];

            const adapters = getRegisteredAdapters();

            items.forEach(item => {
                // Skip directories
                if (item.type === 'directory') return;

                // 检查是否有适配器支持此文件
                const adapter = adapters.find(a => a.filePattern.test(item.basename));
                if (adapter) {
                    tasks.push({
                        readerType: type,
                        fileItem: item,
                        client,
                        proxyUrl: appConfig.proxy.url,
                        webdavUrl: readerConfig.webdav.url,
                        syncPath: readerConfig.syncPath,
                    });
                }
            });
        });

        return tasks;
    }, [listQueries, enabledReaders, appConfig]);

    // 4. 并行下载并解析所有文件内容
    const parsedQueries = useQueries({
        queries: filesToDownload.map(task => ({
            queryKey: ['library', 'parse', task.readerType, task.webdavUrl, task.fileItem.filename, task.fileItem.lastmod],
            queryFn: async () => {
                // 构造相对路径用于 readFile
                try {
                    // task.fileItem.filename 是 WebDAV 返回的绝对路径（如 /app/backup/anx/database7.db）
                    // task.webdavUrl 是配置的基础 URL（如 https://dav.seeyou2night.day/app/backup)
                    // readFile 需要的是相对于 webdavBaseUrl 的路径

                    // 提取 webdavUrl 的 pathname 部分（如 /app/backup）
                    const basePathname = new URL(task.webdavUrl).pathname;

                    // 计算相对路径
                    let relativePath = task.fileItem.filename;
                    if (basePathname && basePathname !== '/' && relativePath.startsWith(basePathname)) {
                        // 如果 filename 以 basePathname 开头，去掉这部分得到相对路径
                        relativePath = relativePath.substring(basePathname.length);
                    }

                    // 1. 下载
                    const buffer = await readFile<ArrayBuffer>(
                        task.client,
                        task.webdavUrl,
                        relativePath,
                        task.proxyUrl,
                        { responseType: 'arraybuffer' }
                    );

                    // 2. 解析
                    if (task.readerType === 'moonReader') {
                        const { parseMoonReaderFile } = await import('../adapters/moon-reader');
                        return await parseMoonReaderFile(buffer, task.fileItem.filename);
                    } else if (task.readerType === 'anxReader') {
                        const { parseAnxDatabase } = await import('../adapters/anx-reader');
                        const result = await parseAnxDatabase(buffer);
                        return result.notes;
                    }

                    return [] as UnifiedNote[];
                } catch (error) {
                    return [] as UnifiedNote[];
                }
            },
            staleTime: 5 * 60 * 1000,
        })),
    });

    // 5. 聚合数据
    const aggregatedData = useMemo(() => {
        let allNotes: UnifiedNote[] = [];

        parsedQueries.forEach(q => {
            if (q.data) {
                allNotes = [...allNotes, ...q.data];
            }
        });

        // 生成 Books
        const booksMap = new Map<string, UnifiedBook>();

        allNotes.forEach(note => {
            // 标准化书名
            const title = note.bookTitle || 'Unknown Book';

            if (!booksMap.has(title)) {
                booksMap.set(title, {
                    title,
                    author: (note.rawData as any)?.author,
                    noteCount: 0,
                    lastReading: note.createdAt,
                    sourceApps: []
                });
            }

            const book = booksMap.get(title)!;
            book.noteCount++;
            if (note.createdAt > (book.lastReading || new Date(0))) {
                book.lastReading = note.createdAt;
            }
            if (!book.sourceApps.includes(note.sourceApp)) {
                book.sourceApps.push(note.sourceApp);
            }
        });

        return {
            notes: allNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
            books: Array.from(booksMap.values()).sort((a, b) => (b.lastReading?.getTime() || 0) - (a.lastReading?.getTime() || 0)),
            isLoading: listQueries.some(q => q.isLoading) || parsedQueries.some(q => q.isLoading),
            errors: [...listQueries, ...parsedQueries].map(q => q.error).filter(Boolean) as Error[]
        };
    }, [listQueries, parsedQueries]);

    return {
        ...aggregatedData,
        refresh: () => {
            listQueries.forEach(q => q.refetch());
            parsedQueries.forEach(q => q.refetch());
        }
    };
}
