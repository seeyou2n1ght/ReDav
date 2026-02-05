/**
 * 配置存储工具函数
 * 封装配置的 CRUD 操作
 */

import { db, type StoredConfig } from './db';
import type { AppConfig } from '../types';

/**
 * 固定的配置 ID
 */
const CONFIG_ID = 'current';

/**
 * 保存配置到 IndexedDB
 * @param config 应用配置
 */
export async function saveConfig(config: AppConfig): Promise<void> {
    const storedConfig: StoredConfig = {
        id: CONFIG_ID,
        readers: config.readers,
        proxy: config.proxy,
        updatedAt: new Date(),
    };

    try {
        await db.configs.put(storedConfig);
    } catch (error) {
        console.error('保存配置失败:', error);
        throw new Error('无法保存配置，请检查浏览器是否支持 IndexedDB');
    }
}

/**
 * 从 IndexedDB 加载配置
 * @returns 应用配置，如果不存在则返回 null
 */
export async function loadConfig(): Promise<AppConfig | null> {
    try {
        const storedConfig = await db.configs.get(CONFIG_ID);

        if (!storedConfig) {
            return null;
        }

        return {
            readers: storedConfig.readers,
            proxy: storedConfig.proxy,
        };
    } catch (error) {
        console.error('加载配置失败:', error);
        // 优雅降级：IndexedDB 不可用时返回 null
        return null;
    }
}

/**
 * 清除配置（用于重置功能）
 */
export async function clearConfig(): Promise<void> {
    try {
        await db.configs.delete(CONFIG_ID);
    } catch (error) {
        console.error('清除配置失败:', error);
        throw new Error('无法清除配置');
    }
}
