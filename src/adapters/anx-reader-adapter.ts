/**
 * AnxReader 适配器实现
 * 解析 AnxReader SQLite 数据库（database7.db）提取笔记
 */

import type { ReaderAdapter, ParseContext, ParseResult } from './types';
import type { UnifiedBook } from '../types';
import { parseAnxDatabase } from './anx-reader';
import { getCachedData, saveToCache, needsUpdate } from '../utils/anx-cache';
import type { AnxBook } from './anx-reader';

export interface AnxReaderAdapterConfig {
  webdavUrl: string;
  syncPath: string;
  proxyUrl: string;
  username: string;
  password: string;
  proxyToken?: string;
}

function anxBookToUnifiedBook(anxBook: AnxBook): UnifiedBook {
  return {
    title: anxBook.title,
    noteCount: anxBook.noteCount,
    sourceApps: ['AnxReader'],
  };
}

async function fetchDatabaseEtag(
  config: AnxReaderAdapterConfig
): Promise<string> {
  const dbPath = config.syncPath.endsWith('/')
    ? `${config.syncPath}database7.db`
    : `${config.syncPath}/database7.db`;
  const targetUrl = config.webdavUrl + dbPath;
  const proxyEndpoint = `${config.proxyUrl.replace(/\/$/, '')}/proxy?target=${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyEndpoint, {
    method: 'HEAD',
    headers: {
      'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
      ...(config.proxyToken ? { 'X-Proxy-Auth': config.proxyToken } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`获取 ETag 失败: ${response.status}`);
  }

  return response.headers.get('ETag') ||
    response.headers.get('Last-Modified') ||
    Date.now().toString();
}

async function fetchDatabase(
  config: AnxReaderAdapterConfig
): Promise<ArrayBuffer> {
  const dbPath = config.syncPath.endsWith('/')
    ? `${config.syncPath}database7.db`
    : `${config.syncPath}/database7.db`;
  const targetUrl = config.webdavUrl + dbPath;
  const proxyEndpoint = `${config.proxyUrl.replace(/\/$/, '')}/proxy?target=${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyEndpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
      ...(config.proxyToken ? { 'X-Proxy-Auth': config.proxyToken } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`下载数据库失败: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}

export const anxReaderAdapter: ReaderAdapter = {
  name: 'AnxReader',
  filePattern: /^database7\.db$/i,
  async parse(context: ParseContext): Promise<ParseResult> {
    const anxConfig = context.adapterConfig as AnxReaderAdapterConfig | undefined;

    if (anxConfig) {
      const remoteEtag = await fetchDatabaseEtag(anxConfig);
      const shouldUpdate = await needsUpdate(remoteEtag);

      if (!shouldUpdate) {
        const cached = await getCachedData();
        if (cached) {
          return {
            notes: cached.notes,
            books: cached.books.map(anxBook => anxBookToUnifiedBook(anxBook)),
          };
        }
      }

      const buffer = await fetchDatabase(anxConfig);
      const result = await parseAnxDatabase(buffer);
      await saveToCache(remoteEtag, result.books, result.notes);

      return {
        notes: result.notes,
        books: result.books.map(anxBook => anxBookToUnifiedBook(anxBook)),
      };
    }

    const result = await parseAnxDatabase(context.buffer);
    return {
      notes: result.notes,
      books: result.books.map(anxBook => anxBookToUnifiedBook(anxBook)),
    };
  },
};

export async function findAnxReaderFiles(
  config: AnxReaderAdapterConfig
): Promise<Array<{ filename: string; lastmod: string }>> {
  const targetPath = config.syncPath.endsWith('/')
    ? `${config.syncPath}anx`
    : `${config.syncPath}/anx`;

  const { listDirectory } = await import('../utils/webdav-client');
  const { parseWebDAVXml } = await import('../utils/webdav-parser');

  const xml = await listDirectory(
    {} as never,
    config.webdavUrl,
    targetPath,
    config.proxyUrl
  );

  const items = parseWebDAVXml(xml);
  return items
    .filter(item => item.type === 'file' && item.basename === 'database7.db')
    .map(item => ({ filename: item.filename, lastmod: item.lastmod }));
}

