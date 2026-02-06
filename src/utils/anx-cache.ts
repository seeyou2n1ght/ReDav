/**
 * AnxReader 缓存管理
 * 实现基于 ETag/Last-Modified 的增量同步
 */

import { db, type AnxCache } from './db';
import type { UnifiedNote } from '../adapters/types';
import type { AnxBook } from '../adapters/anx-reader';

const CACHE_ID = 'anx-cache';

/**
 * 获取缓存的 ETag
 * @returns 缓存的 ETag，如果没有缓存则返回 null
 */
export async function getCachedEtag(): Promise<string | null> {
    const cache = await db.anxCache.get(CACHE_ID);
    return cache?.etag ?? null;
}

/**
 * 获取缓存的数据
 * @returns 缓存的书籍和笔记，如果没有缓存则返回 null
 */
export async function getCachedData(): Promise<{
    books: AnxBook[];
    notes: UnifiedNote[];
    cachedAt: Date;
} | null> {
    const cache = await db.anxCache.get(CACHE_ID);
    if (!cache) {
        return null;
    }
    return {
        books: cache.books,
        notes: cache.notes,
        cachedAt: cache.cachedAt,
    };
}

/**
 * 保存数据到缓存
 * @param etag - ETag 或 Last-Modified 值
 * @param books - 书籍列表
 * @param notes - 笔记列表
 */
export async function saveToCache(
    etag: string,
    books: AnxBook[],
    notes: UnifiedNote[]
): Promise<void> {
    const cache: AnxCache = {
        id: CACHE_ID,
        etag,
        cachedAt: new Date(),
        books,
        notes,
    };
    await db.anxCache.put(cache);
}

/**
 * 清除缓存
 */
export async function clearCache(): Promise<void> {
    await db.anxCache.delete(CACHE_ID);
}

/**
 * 检查是否需要更新
 * @param newEtag - 新的 ETag 值
 * @returns true 如果需要更新（ETag 不同或没有缓存）
 */
export async function needsUpdate(newEtag: string): Promise<boolean> {
    const cachedEtag = await getCachedEtag();
    return cachedEtag !== newEtag;
}
