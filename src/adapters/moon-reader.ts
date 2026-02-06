/**
 * MoonReader (.an) 适配器
 * 支持 .an 文件解压和 Gap Analysis 解析
 */

import pako from 'pako';
import type { UnifiedNote } from './types';

/**
 * 解压 .an 文件内容
 * 尝试多种解压方式：inflateRaw -> inflate -> ungzip -> utf-8 text
 */
export function decodeAnFile(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);

  try {
    return pako.inflateRaw(uint8Array, { to: 'string' });
  } catch (e1) {
    try {
      return pako.inflate(uint8Array, { to: 'string' });
    } catch (e2) {
      try {
        return pako.ungzip(uint8Array, { to: 'string' });
      } catch (e3) {
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
    let section = sections[i].trim();
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
 */
export async function parseMoonReaderFile(
  buffer: ArrayBuffer,
  filename: string
): Promise<UnifiedNote[]> {
  const text = decodeAnFile(buffer);
  const notes = parseMoonReaderContent(text);

  // 使用文件名修正书名 (e.g. "BookName.epub.an" -> "BookName")
  const displayName = filename.replace(/\.epub\.an$/i, '').replace(/\.an$/i, '');

  return notes.map(note => ({
    ...note,
    bookTitle: displayName
  }));
}
