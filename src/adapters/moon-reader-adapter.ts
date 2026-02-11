/**
 * MoonReader 适配器实现
 * 解析 MoonReader .an 文件提取笔记
 */

import type { ReaderAdapter, ParseContext, ParseResult } from './types';
import { decodeAnFile, parseMoonReaderContent } from './moon-reader';
import { getCachedNotes, saveToCache } from '../utils/moon-cache';

export const moonReaderAdapter: ReaderAdapter = {
  name: 'MoonReader',
  filePattern: /\.an$/i,
  async parse(context: ParseContext): Promise<ParseResult> {
    const cached = await getCachedNotes(context.filename);
    if (cached) {
      return { notes: cached };
    }

    const text = decodeAnFile(context.buffer);
    const notes = parseMoonReaderContent(text);

    await saveToCache(context.filename, Date.now().toString(), notes);

    return { notes };
  },
};
