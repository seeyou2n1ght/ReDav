/**
 * AnxReader 适配器
 * 解析 AnxReader 导出的 JSON 格式笔记
 */

import type { ReaderAdapter, UnifiedNote } from './types';

export const anxReaderAdapter: ReaderAdapter = {
  name: 'AnxReader',
  filePattern: /\.json$/,
  
  parse(content: string): UnifiedNote[] {
    const data = JSON.parse(content);
    
    // AnxReader JSON 格式示例:
    // {
    //   "bookTitle": "书名",
    //   "highlights": [
    //     {
    //       "id": "uuid",
    //       "text": "高亮文本",
    //       "note": "笔记内容",
    //       "chapter": "章节名",
    //       "page": 123,
    //       "createdAt": "2024-01-01T00:00:00Z"
    //     }
    //   ]
    // }
    
    return data.highlights?.map((h: any) => ({
      id: h.id || `${data.bookTitle}-${h.createdAt}`,
      bookTitle: data.bookTitle,
      chapter: h.chapter,
      highlight: h.text || '',
      note: h.note,
      page: h.page,
      createdAt: new Date(h.createdAt),
      updatedAt: h.updatedAt ? new Date(h.updatedAt) : undefined,
      sourceApp: 'AnxReader',
      rawData: h,
    })) || [];
  },
};
