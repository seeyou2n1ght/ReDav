/**
 * AnxReader 适配器实现
 * 解析 AnxReader SQLite 数据库（database7.db）提取笔记
 */

import type { ReaderAdapter, ParseContext, ParseResult } from './types';
import type { UnifiedBook } from '../types';
import { parseAnxDatabase } from './anx-reader';

function anxBookToUnifiedBook(anxBook: { id: number; title: string; noteCount: number }): UnifiedBook {
  return {
    title: anxBook.title,
    noteCount: anxBook.noteCount,
    sourceApps: ['AnxReader'],
  };
}

export const anxReaderAdapter: ReaderAdapter = {
  name: 'AnxReader',
  filePattern: /^database7\.db$/i,
  async parse(context: ParseContext): Promise<ParseResult> {
    const result = await parseAnxDatabase(context.buffer);
    return {
      notes: result.notes,
      books: result.books.map(anxBook => anxBookToUnifiedBook(anxBook)),
    };
  },
};
