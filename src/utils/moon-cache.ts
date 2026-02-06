/**
 * MoonReader 缓存管理
 * 基于每个 .an 文件的 lastModified 进行增量同步
 */

import { db } from './db';
import type { UnifiedNote } from '../adapters/types';

/**
 * 缓存项结构
 */
export interface MoonFileCache {
    /** 文件名 (作为主键) */
    filename: string;
    /** 文件的 Last-Modified 时间戳 */
    lastModified: string;
    /** 更新时间 */
    updatedAt: Date;
    /** 解析后的笔记 */
    notes: UnifiedNote[];
}

/**
 * 检查文件是否需要更新
 * @param filename - 文件名
 * @param remoteLastModified - 远程文件的 Last-Modified
 * @returns true 如果需要更新
 */
export async function needsUpdate(
    filename: string,
    remoteLastModified: string
): Promise<boolean> {
    const cache = await db.moonCache.get(filename);
    if (!cache) return true;
    return cache.lastModified !== remoteLastModified;
}

/**
 * 获取缓存的笔记
 * @param filename - 文件名
 */
export async function getCachedNotes(filename: string): Promise<UnifiedNote[] | null> {
    const cache = await db.moonCache.get(filename);
    return cache ? cache.notes : null;
}

/**
 * 保存缓存
 */
export async function saveToCache(
    filename: string,
    lastModified: string,
    notes: UnifiedNote[]
): Promise<void> {
    const cache: MoonFileCache = {
        filename,
        lastModified,
        updatedAt: new Date(),
        notes,
    };
    await db.moonCache.put(cache);
}

/**
 * 获取所有缓存的笔记（用于离线查看）
 */
export async function getAllCachedNotes(): Promise<UnifiedNote[]> {
    const allCache = await db.moonCache.toArray();
    return allCache.flatMap((c: MoonFileCache) => c.notes);
}
