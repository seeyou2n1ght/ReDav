/**
 * MoonReader 适配器实现
 * 解析 MoonReader .an 文件提取笔记
 */

import type { ReaderAdapter, ParseContext, ParseResult } from './types';
import type { AxiosInstance } from 'axios';
import { decodeAnFile, parseMoonReaderContent } from './moon-reader';
import { getCachedNotes, saveToCache } from '../utils/moon-cache';
import { readFile, listDirectory } from '../utils/webdav-client';
import { parseWebDAVXml } from '../utils/webdav-parser';
import type { MoonBookMetadata } from './moon-reader';

const CACHE_DIR = '/.Moon+/Cache';

export interface MoonReaderAdapterConfig {
  syncPath: string;
  webdavUrl: string;
  proxyUrl: string;
  client: AxiosInstance;
}

async function getBooksSyncMetadata(
  config: MoonReaderAdapterConfig
): Promise<Map<string, MoonBookMetadata>> {
  try {
    const booksSyncPath = `${config.syncPath.replace(/\/$/, '')}/.Moon+/books.sync`;
    const buffer = await readFile<ArrayBuffer>(
      config.client,
      config.webdavUrl,
      booksSyncPath,
      config.proxyUrl,
      { responseType: 'arraybuffer' }
    );
    const { parseBooksSync } = await import('./moon-reader');
    return parseBooksSync(buffer);
  } catch {
    console.warn('[MoonReader] books.sync 下载失败，将使用文件名作为书名');
    return new Map();
  }
}

export const moonReaderAdapter: ReaderAdapter = {
  name: 'MoonReader',
  filePattern: /\.an$/i,
  async parse(context: ParseContext): Promise<ParseResult> {
    const { buffer, filename, adapterConfig } = context;
    const moonConfig = adapterConfig as MoonReaderAdapterConfig | undefined;

    if (moonConfig) {
      const cached = await getCachedNotes(filename);
      if (cached) {
        return { notes: cached };
      }

      const metadataMap = await getBooksSyncMetadata(moonConfig);
      const text = decodeAnFile(buffer);
      let notes = parseMoonReaderContent(text);

      const baseFilename = filename.split('/').pop()?.replace(/\.an$/, '') || '';
      const bookMetadata = metadataMap.get(baseFilename);

      if (bookMetadata) {
        notes = notes.map(note => ({
          ...note,
          bookTitle: bookMetadata.bookName,
          rawData: { ...(note.rawData as object), author: bookMetadata.author }
        }));
      }

      await saveToCache(filename, Date.now().toString(), notes);
      return { notes };
    }

    const cached = await getCachedNotes(filename);
    if (cached) {
      return { notes: cached };
    }

    const text = decodeAnFile(buffer);
    const notes = parseMoonReaderContent(text);
    await saveToCache(filename, Date.now().toString(), notes);

    return { notes };
  },
};

export async function findMoonReaderFiles(
  config: MoonReaderAdapterConfig
): Promise<Array<{ filename: string; lastmod: string }>> {
  const targetPath = config.syncPath.endsWith(CACHE_DIR)
    ? config.syncPath
    : `${config.syncPath.replace(/\/$/, '')}${CACHE_DIR}`;

  const xml = await listDirectory(
    config.client,
    config.webdavUrl,
    targetPath,
    config.proxyUrl
  );

  const items = parseWebDAVXml(xml);
  return items
    .filter(item => item.type === 'file' && item.basename.endsWith('.an'))
    .sort((a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime())
    .map(item => ({ filename: item.filename, lastmod: item.lastmod }));
}
