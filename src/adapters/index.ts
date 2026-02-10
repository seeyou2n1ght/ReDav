/**
 * 阅读器适配器统一导出
 */

import type { ReaderAdapter, UnifiedNote } from './types';

// 适配器注册表
const adapters: ReaderAdapter[] = [
  {
    name: 'AnxReader',
    filePattern: /^database7\.db$/i,
    parse: () => [] // 实际解析逻辑在 useLibrary 中通过动态导入处理
  },
  {
    name: 'MoonReader',
    filePattern: /\.an$/i,
    parse: () => []
  },
  {
    name: 'KoReader',
    filePattern: /\.sdr$/i, // 假设模式，后续完善
    parse: () => []
  }
];

/**
 * 注册适配器
 */
export function registerAdapter(adapter: ReaderAdapter): void {
  adapters.push(adapter);
}

/**
 * 根据文件名自动选择适配器并解析
 */
export function parseNotes(filename: string, content: string): UnifiedNote[] {
  const adapter = adapters.find(a => a.filePattern.test(filename));

  if (!adapter) {
    throw new Error(`未找到适配器: ${filename}`);
  }

  return adapter.parse(content);
}

/**
 * 获取支持的文件类型
 */
export function getSupportedPatterns(): RegExp[] {
  return adapters.map(a => a.filePattern);
}

/**
 * 获取所有已注册的适配器
 */
export function getRegisteredAdapters(): ReaderAdapter[] {
  return [...adapters];
}

// 导出类型
export type { ReaderAdapter, UnifiedNote } from './types';
