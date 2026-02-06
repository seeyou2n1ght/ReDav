/**
 * AnxReader 适配器
 * 解析 AnxReader SQLite 数据库（database7.db）提取笔记
 * 
 * 数据库结构（参考 anx_NoteExporter.py）：
 * - tb_books: id, title
 * - tb_notes: id, book_id, content, reader_note, chapter, create_time
 */

import type { UnifiedNote } from './types';
import { loadDatabase, executeQuery, closeDatabase } from '../utils/sqlite-loader';

/**
 * AnxReader 原始笔记格式（数据库查询结果）
 */
interface AnxRawNote {
  [key: string]: unknown;  // 索引签名，满足 Record<string, unknown> 约束
  book_id: number;
  title: string;
  content: string | null;
  reader_note: string | null;
  chapter: string | null;
  create_time: string | null;
}

/**
 * 书籍信息
 */
export interface AnxBook {
  id: number;
  title: string;
  noteCount: number;
}

/**
 * AnxReader 适配器结果
 */
export interface AnxReaderResult {
  books: AnxBook[];
  notes: UnifiedNote[];
}

/**
 * 从 database7.db 二进制数据解析笔记
 * @param buffer - 数据库文件的 ArrayBuffer
 * @returns 书籍列表和笔记列表
 */
export async function parseAnxDatabase(buffer: ArrayBuffer): Promise<AnxReaderResult> {
  const db = await loadDatabase(buffer);

  try {
    // 查询所有笔记（与 Python 脚本一致）
    const sql = `
      SELECT 
        b.id as book_id,
        b.title,
        n.content,
        n.reader_note,
        n.chapter,
        n.create_time
      FROM tb_notes n
      JOIN tb_books b ON n.book_id = b.id
      ORDER BY b.title, n.create_time, n.id
    `;

    const rawNotes = executeQuery<AnxRawNote>(db, sql);

    // 转换为统一笔记格式
    const notes: UnifiedNote[] = rawNotes.map((raw, index) => ({
      id: `anx-${raw.book_id}-${index}-${raw.create_time || Date.now()}`,
      bookTitle: raw.title || '未知书籍',
      chapter: raw.chapter || undefined,
      highlight: raw.content || '',
      note: raw.reader_note || undefined,
      createdAt: raw.create_time ? new Date(raw.create_time) : new Date(),
      sourceApp: 'AnxReader',
      rawData: raw,
    }));

    // 统计书籍信息
    const bookMap = new Map<number, AnxBook>();
    for (const raw of rawNotes) {
      const existing = bookMap.get(raw.book_id);
      if (existing) {
        existing.noteCount++;
      } else {
        bookMap.set(raw.book_id, {
          id: raw.book_id,
          title: raw.title || '未知书籍',
          noteCount: 1,
        });
      }
    }

    return {
      books: Array.from(bookMap.values()),
      notes,
    };
  } finally {
    // 确保关闭数据库连接
    closeDatabase(db);
  }
}

/**
 * 按书籍分组笔记
 * @param notes - 笔记列表
 * @returns 按书名分组的笔记 Map
 */
export function groupNotesByBook(notes: UnifiedNote[]): Map<string, UnifiedNote[]> {
  const grouped = new Map<string, UnifiedNote[]>();

  for (const note of notes) {
    const bookNotes = grouped.get(note.bookTitle) || [];
    bookNotes.push(note);
    grouped.set(note.bookTitle, bookNotes);
  }

  return grouped;
}
