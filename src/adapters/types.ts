/**
 * 阅读器适配器类型定义
 */

import type { UnifiedNote, UnifiedBook } from '../types';

/**
 * 解析上下文
 */
export interface ParseContext {
  /** 文件的二进制内容 */
  buffer: ArrayBuffer;
  /** 文件完整路径（用于元数据查找） */
  filename: string;
  /** WebDAV 基础 URL（用于构建元数据路径） */
  baseUrl: string;
  /** 适配器配置（可选，特定适配器可能需要） */
  adapterConfig?: unknown;
}

/**
 * 解析结果
 */
export interface ParseResult {
  /** 笔记列表 */
  notes: UnifiedNote[];
  /** 书籍列表（可选，部分适配器需要返回） */
  books?: UnifiedBook[];
}

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
   * @param context - 解析上下文
   * @returns 解析结果
   * @throws 解析失败时抛出错误
   */
  parse(context: ParseContext): Promise<ParseResult>;
}

export type { UnifiedNote };
