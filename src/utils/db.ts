/**
 * IndexedDB 数据库配置
 * 使用 Dexie.js 封装 IndexedDB 操作
 */

import Dexie, { type EntityTable } from 'dexie';
import type { AppConfig } from '../types';

/**
 * 数据库中存储的配置对象
 */
export interface StoredConfig {
  /** 固定 ID，始终为 'current' */
  id: string;
  /** WebDAV 配置 */
  webdav: AppConfig['webdav'];
  /** Proxy 配置 */
  proxy: AppConfig['proxy'];
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * ReDav 数据库实例
 */
class ReDavDatabase extends Dexie {
  configs!: EntityTable<StoredConfig, 'id'>;

  constructor() {
    super('redav_db');

    // 定义数据库 Schema（版本 1）
    this.version(1).stores({
      configs: 'id', // 主键为 id
    });
  }
}

/**
 * 导出数据库单例实例
 */
export const db = new ReDavDatabase();
