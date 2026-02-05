/**
 * 阅读器适配器类型定义
 */

/**
 * 统一笔记格式
 */
export interface UnifiedNote {
  /** 唯一标识 */
  id: string;
  /** 书名 */
  bookTitle: string;
  /** 章节 */
  chapter?: string;
  /** 高亮内容 */
  highlight: string;
  /** 用户笔记 */
  note?: string;
  /** 页码/位置 */
  page?: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt?: Date;
  /** 来源应用 */
  sourceApp: string;
  /** 原始数据（调试用） */
  rawData?: unknown;
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
   * @param content 文件内容
   * @returns 统一格式的笔记数组
   */
  parse(content: string): UnifiedNote[];
}
