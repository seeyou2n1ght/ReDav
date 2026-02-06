/**
 * IndexedDB 数据库配置
 * 使用 Dexie.js 封装 IndexedDB 操作
 */

import Dexie, { type EntityTable } from 'dexie';
import type { AppConfig } from '../types';
import type { UnifiedNote } from '../adapters/types';
import type { AnxBook } from '../adapters/anx-reader';

/**
 * 数据库中存储的配置对象
 */
export interface StoredConfig {
  /** 固定 ID，始终为 'current' */
  id: string;
  /** 阅读器配置（按类型） */
  readers: AppConfig['readers'];
  /** Proxy 配置 */
  proxy: AppConfig['proxy'];
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * AnxReader 缓存数据
 */
export interface AnxCache {
  /** 固定 ID，始终为 'anx-cache' */
  id: string;
  /** 数据库文件的 ETag 或 Last-Modified */
  etag: string;
  /** 缓存时间 */
  cachedAt: Date;
  /** 书籍列表 */
  books: AnxBook[];
  /** 笔记列表 */
  notes: UnifiedNote[];
}

import type { MoonFileCache } from './moon-cache';

/**
 * ReDav 数据库实例
 */
class ReDavDatabase extends Dexie {
  configs!: EntityTable<StoredConfig, 'id'>;
  anxCache!: EntityTable<AnxCache, 'id'>;
  moonCache!: EntityTable<MoonFileCache, 'filename'>;

  constructor() {
    super('redav_db');

    // 版本 1：配置表
    this.version(1).stores({
      configs: 'id',
    });

    // 版本 2：添加 AnxReader 缓存表
    this.version(2).stores({
      configs: 'id',
      anxCache: 'id',
    });

    // 版本 3：添加 MoonReader 缓存表
    this.version(3).stores({
      configs: 'id',
      anxCache: 'id',
      moonCache: 'filename', // 使用文件名作为主键
    });
  }
}

/**
 * 导出数据库单例实例
 */
export const db = new ReDavDatabase();
export type { MoonFileCache }; // 导出类型供 hooks 使用
