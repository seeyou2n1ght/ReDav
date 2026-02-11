/**
 * MoonReader (.an) 适配器
 * 支持 .an 文件解压和 Gap Analysis 解析
 */

import pako from 'pako';
import type { UnifiedNote } from './types';

/**
 * MoonReader 书籍元数据（来自 books.sync）
 */
export interface MoonBookMetadata {
  addTime: string;
  author: string;
  bookName: string;
  category: string;
  description: string;
  downloadUrl: string;
  filename: string;
  favorite: string;
  groupName: string;
  rate: string;
}

/**
 * 解析 books.sync 文件
 * @param buffer - books.sync 文件的 ArrayBuffer
 * @returns filename -> metadata 的映射
 */
export function parseBooksSync(buffer: ArrayBuffer): Map<string, MoonBookMetadata> {
  const uint8 = new Uint8Array(buffer);
  const text = pako.inflate(uint8, { to: 'string' });
  const books: MoonBookMetadata[] = JSON.parse(text);

  const map = new Map<string, MoonBookMetadata>();
  books.forEach(book => {
    map.set(book.filename, book);
  });
  return map;
}

/**
 * 解压 .an 文件内容
 * 尝试多种解压方式：inflateRaw -> inflate -> ungzip -> utf-8 text
 */
export function decodeAnFile(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);

  try {
    return pako.inflateRaw(uint8Array, { to: 'string' });
  } catch {
    try {
      return pako.inflate(uint8Array, { to: 'string' });
    } catch {
      try {
        return pako.ungzip(uint8Array, { to: 'string' });
      } catch {
        // 如果都不是，尝试作为纯文本读取
        return new TextDecoder("utf-8").decode(buffer);
      }
    }
  }
}

/**
 * 解析 MoonReader 文本内容
 */
export function parseMoonReaderContent(text: string): UnifiedNote[] {
  const sections = text.split(/\n#\r?\n/);
  const notes: UnifiedNote[] = [];

  // 第一部分是元数据，格式如下：
  // #
  // <book path>
  // <meta>
  // #
  const metaSection = sections[0].trim();
  const bookPathLine = metaSection.split('\n')[1] || '';
  // 从路径中提取书名（简单处理，hook层会有更好的书名来源）
  let bookTitle = bookPathLine.split('/').pop() || 'Unknown Book';
  if (bookTitle.endsWith('.epub')) {
    bookTitle = bookTitle.replace('.epub', '');
  }

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    const lines = section.split(/\n/).map(l => l.trimEnd());
    if (lines.length < 10) continue;

    const id = lines[0];
    const ts = parseInt(lines[9]) || 0;
    const chapterIndex = parseInt(lines[4]) || 0;
    const startPos = parseInt(lines[6]) || 0;

    // MoonReader 页码估算: 每 1000 字符一页
    const page = Math.floor(startPos / 1000);

    let userNote = "";
    let highlightText = "";

    // Gap Analysis
    // 寻找第10行(索引9)之后第一个非空非0的行作为内容起始
    let firstContentIndex = -1;
    for (let k = 10; k < lines.length; k++) {
      const l = lines[k].trim();
      if (l !== "" && l !== "0") {
        firstContentIndex = k;
        break;
      }
    }

    if (firstContentIndex !== -1) {
      let lastContentIndex = lines.length - 1;
      // 从后往前找最后一个内容行
      while (lastContentIndex >= firstContentIndex &&
        (lines[lastContentIndex].trim() === '0' || lines[lastContentIndex].trim() === '')) {
        lastContentIndex--;
      }

      const contentLines = lines.slice(firstContentIndex, lastContentIndex + 1);
      const gap = firstContentIndex - 10;

      if (gap === 1) {
        // Gap=1: 第一行是用户笔记，后续是高亮
        userNote = contentLines[0].replace(/<BR>/gi, '\n');
        if (contentLines.length > 1) {
          highlightText = contentLines.slice(1).join('\n');
        }
      } else {
        // Gap!=1: 全是高亮
        highlightText = contentLines.join('\n');
      }
    }

    if (userNote || highlightText) {
      notes.push({
        id: `moon-${id}-${ts}`,
        bookTitle: bookTitle, // 临时书名，Hook 层合并时会覆盖为准确书名
        chapter: `Chapter ${chapterIndex}`, // MoonReader 只存了索引
        highlight: highlightText,
        note: userNote || undefined,
        page: page,
        createdAt: new Date(ts),
        sourceApp: 'MoonReader',
        rawData: lines // 保存原始行数据用于调试
      });
    }
  }

  return notes;
}

/**
 * 解析 .an 文件 buffer
 * @param buffer - .an 文件的 ArrayBuffer
 * @param filename - 文件名（用于提取默认书名）
 * @param metadata - 可选的书籍元数据（来自 books.sync）
 */
export async function parseMoonReaderFile(
  buffer: ArrayBuffer,
  filename: string,
  metadata?: MoonBookMetadata
): Promise<UnifiedNote[]> {
  const text = decodeAnFile(buffer);
  const notes = parseMoonReaderContent(text);

  // 优先使用 metadata 中的书名，fallback 到文件名提取
  const displayName = metadata?.bookName || filename.replace(/\.epub\.an$/i, '').replace(/\.an$/i, '');
  const author = metadata?.author;

  return notes.map(note => {
    // 构建 rawData：如果原有 rawData 是 array，保留；否则添加 author
    const rawData = Array.isArray(note.rawData)
      ? note.rawData
      : author
        ? { ...(note.rawData as object || {}), author }
        : note.rawData;

    return {
      ...note,
      bookTitle: displayName,
      rawData
    };
  });
}
