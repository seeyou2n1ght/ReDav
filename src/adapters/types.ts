/**
 * 阅读器适配器类型定义
 */

import type { UnifiedNote } from '../types';

/**
 * 阅读器适配器接口
 */
export interface ReaderAdapter {
  /** 阅读器名称 */
  name: string;
  /** 文件匹配规则 */
  filePattern: RegExp;
  /**
   * 解析笔记内容
   * @param content 文件内容
   * @returns 统一格式的笔记数组
   */
  parse(content: string): UnifiedNote[];
}

export type { UnifiedNote };
