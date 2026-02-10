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
    const { config: appConfig } = useConfig();

    // 1. 获取所有启用的阅读器配置
    const enabledReaders = useMemo(() => {
        if (!appConfig?.readers) return [];
        return Object.entries(appConfig.readers)
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
    }, [appConfig]);

    // 2. 并行获取每个阅读器的目录列表
    const listQueries = useQueries({
        queries: enabledReaders.map(({ type, readerConfig, client }) => ({
            queryKey: ['library', 'ls', type, readerConfig.webdav.url, readerConfig.syncPath],
            queryFn: async () => {
                const xml = await listDirectory(
                    client,
                    readerConfig.webdav.url,
                    readerConfig.syncPath,
                    appConfig?.proxy.url || ''
                );
                const items = parseWebDAVXml(xml);
                return { type, readerConfig, items };
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
                // 检查是否有适配器支持此文件
                const adapter = adapters.find(a => a.filePattern.test(item.filename));
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
                const fullPath = `${task.syncPath}/${task.fileItem.filename}`.replace(/\/+/g, '/');

                // 1. 下载
                const buffer = await readFile<ArrayBuffer>(
                    task.client,
                    task.webdavUrl,
                    fullPath,
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
