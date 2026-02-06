/**
 * MoonReader 数据获取 Hook
 * 整合 WebDAV 下载 (.an 文件)、解析与缓存
 */

import { useQuery } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { useWebDavClient } from './useWebDavClient';
import { listDirectory, readFile } from '../utils/webdav-client';
import { parseWebDAVXml } from '../utils/webdav-parser';
import { parseMoonReaderFile, parseBooksSync } from '../adapters/moon-reader';
import {
    needsUpdate,
    saveToCache,
    getCachedNotes,
} from '../utils/moon-cache';
import type { UnifiedNote } from '../adapters/types';
import type { AnxReaderResult } from '../adapters/anx-reader';

/**
 * .an 文件缓存目录
 */
const CACHE_DIR = '/.Moon+/Cache';

/**
 * useMoonReader Hook
 */
export function useMoonReader() {
    const { config } = useConfig();
    const moonConfig = config?.readers?.moonReader;
    const proxyConfig = config?.proxy;

    const enabled = Boolean(
        moonConfig?.enabled &&
        moonConfig?.webdav?.url &&
        proxyConfig?.url
    );

    // 提供安全的默认值以满足类型要求（即使 disabled 也会调用）
    const client = useWebDavClient({
        webdav: moonConfig?.webdav || { url: '', username: '', password: '' },
        proxy: proxyConfig || { url: '' },
    });

    return useQuery({
        queryKey: ['moonReader', 'notes', moonConfig?.webdav?.url, moonConfig?.syncPath],
        queryFn: async (): Promise<AnxReaderResult> => { // 复用 AnxReaderResult 结构保持 UI 统一
            if (!moonConfig || !proxyConfig) {
                throw new Error('MoonReader 未配置');
            }

            console.log('[MoonReader] 开始同步...');

            // 1. 列出 Cache 目录下的文件
            let targetPath = moonConfig.syncPath;
            if (!targetPath.endsWith(CACHE_DIR)) {
                targetPath = `${targetPath.replace(/\/$/, '')}${CACHE_DIR}`;
            }

            console.log(`[MoonReader] 列出目录: ${targetPath}`);
            const xml = await listDirectory(
                client,
                moonConfig.webdav.url,
                targetPath,
                proxyConfig.url
            );

            const files = parseWebDAVXml(xml)
                .filter(item => item.type === 'file' && item.basename.endsWith('.an'))
                // 按修改时间倒序排列，优先同步最近的书
                .sort((a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime());

            console.log(`[MoonReader] 发现 ${files.length} 个 .an 文件`);

            // 2. 下载并解析 books.sync 获取书籍元数据
            let metadataMap = new Map<string, any>();
            try {
                const booksSyncPath = `${moonConfig.syncPath.replace(/\/$/, '')}/.Moon+/books.sync`;
                console.log(`[MoonReader] 下载 books.sync...`);
                const booksSyncBuffer = await readFile<ArrayBuffer>(
                    client,
                    moonConfig.webdav.url,
                    booksSyncPath,
                    proxyConfig.url,
                    { responseType: 'arraybuffer' }
                );
                metadataMap = parseBooksSync(booksSyncBuffer);
                console.log(`[MoonReader] 解析到 ${metadataMap.size} 本书籍元数据`);
            } catch (e) {
                console.warn(`[MoonReader] books.sync 下载失败，将使用文件名作为书名:`, e);
            }

            // 3. 检查哪些文件需要更新
            const updateQueue = [];
            const allNotes: UnifiedNote[] = [];
            const processedFiles = new Set<string>();

            for (const file of files) {
                // 使用 filename (完整路径) 和 lastmod
                if (await needsUpdate(file.filename, file.lastmod)) {
                    updateQueue.push(file);
                } else {
                    // 不需要更新，从缓存读取
                    const cachedNotes = await getCachedNotes(file.filename);
                    if (cachedNotes) {
                        allNotes.push(...cachedNotes);
                    } else {
                        // 缓存失效，加入更新队列
                        updateQueue.push(file);
                    }
                }
                processedFiles.add(file.filename);
            }

            console.log(`[MoonReader] 需要更新 ${updateQueue.length} 个文件`);

            // 3. 并行下载更新（限制并发数）
            const CONCURRENCY = 5;
            for (let i = 0; i < updateQueue.length; i += CONCURRENCY) {
                const chunk = updateQueue.slice(i, i + CONCURRENCY);
                await Promise.all(chunk.map(async (file) => {
                    try {
                        console.log(`[MoonReader] 下载: ${file.filename}`);
                        const buffer = await readFile<ArrayBuffer>(
                            client,
                            moonConfig.webdav.url,
                            file.filename, // 使用完整路径
                            proxyConfig.url,
                            { responseType: 'arraybuffer' }
                        );

                        // 获取对应的元数据
                        const baseFilename = file.basename.replace(/\.an$/, '');
                        const metadata = metadataMap.get(baseFilename);

                        // 解析（传入元数据）
                        const notes = await parseMoonReaderFile(buffer, file.filename, metadata);

                        // 缓存
                        await saveToCache(file.filename, file.lastmod, notes);

                        allNotes.push(...notes);
                    } catch (e) {
                        console.error(`[MoonReader] 处理文件失败 ${file.filename}:`, e);
                    }
                }));
            }

            // 4. 清理旧缓存（可选：遍历 moonCache 删除不在 files 中的项）
            // 暂时跳过

            // 5. 组织返回结果
            // 聚合书籍信息
            const bookMap = new Map<string, { title: string; count: number }>();
            for (const note of allNotes) {
                const existing = bookMap.get(note.bookTitle);
                if (existing) {
                    existing.count++;
                } else {
                    bookMap.set(note.bookTitle, {
                        title: note.bookTitle,
                        count: 1
                    });
                }
            }

            const books = Array.from(bookMap.values()).map((b, index) => ({
                id: index, // 临时 ID
                title: b.title,
                noteCount: b.count
            }));

            return {
                books,
                notes: allNotes
            };
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        retry: 1
    });
}
