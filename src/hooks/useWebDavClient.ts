/**
 * WebDAV 客户端 Hook
 * 基于配置创建可复用的 axios 实例
 */

import { useMemo } from 'react';
import { createWebDAVClient } from '../utils/webdav-client';
import type { WebDAVConfig, ProxyConfig } from '../types';

/**
 * 单个阅读器的 WebDAV 连接配置
 * 用于 WebDAV 客户端和相关 Hooks
 */
export interface WebDAVConnectionConfig {
    webdav: WebDAVConfig;
    proxy: ProxyConfig;
}

/**
 * 创建 WebDAV 客户端的 Hook
 * @param config - WebDAV 连接配置
 * @returns 配置好的 axios 实例
 */
export function useWebDavClient(config: WebDAVConnectionConfig) {
    return useMemo(() => createWebDAVClient(config), [
        config.webdav.url,
        config.webdav.username,
        config.webdav.password,
        config.proxy.url,
        config.proxy.token,
    ]);
}
