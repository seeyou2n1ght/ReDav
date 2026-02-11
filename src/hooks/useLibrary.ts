/**
 * 核心数据聚合 Hook
 * 从所有启用的阅读器获取数据，并解析为统一格式
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useConfig } from './useConfig';
import { createWebDAVClient, listDirectory, readFile } from '../utils/webdav-client';
import { parseWebDAVXml } from '../utils/webdav-parser';
import { parseFile, type ParseContext, type ParseResult } from '../adapters';
import { findMoonReaderFiles, type MoonReaderAdapterConfig } from '../adapters/moon-reader-adapter';
import { findAnxReaderFiles, type AnxReaderAdapterConfig } from '../adapters/anx-reader-adapter';
import type { UnifiedNote, ReaderType, ReaderConfig, UnifiedBook, WebDAVItem } from '../types';
import type { AxiosInstance } from 'axios';

interface ListQueryResult {
  type: ReaderType;
  readerConfig: ReaderConfig;
  items: WebDAVItem[];
}

interface DownloadTask {
  filename: string;
  lastmod: string;
  client: AxiosInstance;
  proxyUrl: string;
  webdavUrl: string;
  readerType: ReaderType;
  adapterConfig?: MoonReaderAdapterConfig | AnxReaderAdapterConfig;
}

export interface LibraryData {
  books: UnifiedBook[];
  notes: UnifiedNote[];
  isLoading: boolean;
  errors: Error[];
  refresh: () => void;
}

export function useLibrary(): LibraryData {
  const { config: appConfig } = useConfig();

  const enabledReaders = useMemo(() => {
    if (!appConfig?.readers) return [];
    const readers = Object.entries(appConfig.readers)
      .filter(([, cfg]) => cfg?.enabled)
      .map(([type, cfg]) => ({
        type: type as ReaderType,
        readerConfig: cfg as ReaderConfig,
        client: createWebDAVClient({
          webdav: cfg!.webdav,
          proxy: appConfig.proxy,
        }),
      }));
    return readers;
  }, [appConfig]);

  const listQueries = useQueries({
    queries: enabledReaders.map(({ type, readerConfig, client }) => ({
      queryKey: ['library', 'ls', type, readerConfig.webdav.url, readerConfig.syncPath],
      queryFn: async (): Promise<ListQueryResult> => {
        let items: WebDAVItem[];

        if (type === 'moonReader') {
          const moonConfig: MoonReaderAdapterConfig = {
            syncPath: readerConfig.syncPath,
            webdavUrl: readerConfig.webdav.url,
            proxyUrl: appConfig?.proxy.url || '',
            client,
          };
          const files = await findMoonReaderFiles(moonConfig);
          items = files.map(f => ({
            filename: f.filename,
            basename: f.filename.split('/').pop() || f.filename,
            lastmod: f.lastmod,
            size: 0,
            type: 'file' as const,
          }));
        } else if (type === 'anxReader') {
          const anxConfig: AnxReaderAdapterConfig = {
            syncPath: readerConfig.syncPath,
            webdavUrl: readerConfig.webdav.url,
            proxyUrl: appConfig?.proxy.url || '',
            username: readerConfig.webdav.username,
            password: readerConfig.webdav.password,
          };
          const files = await findAnxReaderFiles(anxConfig);
          items = files.map(f => ({
            filename: f.filename,
            basename: 'database7.db',
            lastmod: f.lastmod,
            size: 0,
            type: 'file' as const,
          }));
        } else {
          const xml = await listDirectory(
            client,
            readerConfig.webdav.url,
            readerConfig.syncPath,
            appConfig?.proxy.url || ''
          );
          items = parseWebDAVXml(xml);
        }

        return { type, readerConfig, items };
      },
      staleTime: 60 * 1000,
      enabled: !!appConfig,
    })),
  });

  const filesToDownload = useMemo((): DownloadTask[] => {
    if (!appConfig) return [];

    const tasks: DownloadTask[] = [];

    listQueries.forEach((query, index) => {
      if (!query.data) return;
      const { type, readerConfig, items } = query.data;
      const { client } = enabledReaders[index];

      items.forEach(item => {
        if (item.type === 'directory') return;

        const basePathname = new URL(readerConfig.webdav.url).pathname;
        let relativePath = item.filename;
        if (basePathname && basePathname !== '/' && relativePath.startsWith(basePathname)) {
          relativePath = relativePath.substring(basePathname.length);
        }

        let adapterConfig: MoonReaderAdapterConfig | AnxReaderAdapterConfig | undefined;
        if (type === 'moonReader') {
          adapterConfig = {
            syncPath: readerConfig.syncPath,
            webdavUrl: readerConfig.webdav.url,
            proxyUrl: appConfig.proxy.url,
            client,
          };
        } else if (type === 'anxReader') {
          adapterConfig = {
            syncPath: readerConfig.syncPath,
            webdavUrl: readerConfig.webdav.url,
            proxyUrl: appConfig.proxy.url,
            username: readerConfig.webdav.username,
            password: readerConfig.webdav.password,
          };
        }

        tasks.push({
          filename: relativePath,
          lastmod: item.lastmod,
          client,
          proxyUrl: appConfig.proxy.url,
          webdavUrl: readerConfig.webdav.url,
          readerType: type,
          adapterConfig,
        });
      });
    });

    return tasks;
  }, [listQueries, enabledReaders, appConfig]);

  const parsedQueries = useQueries({
    queries: filesToDownload.map(task => ({
      queryKey: ['library', 'parse', task.readerType, task.webdavUrl, task.filename, task.lastmod],
      queryFn: async (): Promise<UnifiedNote[]> => {
        const buffer = await readFile<ArrayBuffer>(
          task.client,
          task.webdavUrl,
          task.filename,
          task.proxyUrl,
          { responseType: 'arraybuffer' }
        );

        const context: ParseContext = {
          buffer,
          filename: task.filename,
          baseUrl: task.webdavUrl,
          adapterConfig: task.adapterConfig,
        };

        let result: ParseResult;
        if (task.readerType === 'moonReader' && task.adapterConfig) {
          const { moonReaderAdapter } = await import('../adapters/moon-reader-adapter');
          result = await moonReaderAdapter.parse(context);
        } else if (task.readerType === 'anxReader' && task.adapterConfig) {
          const { anxReaderAdapter } = await import('../adapters/anx-reader-adapter');
          result = await anxReaderAdapter.parse(context);
        } else {
          result = await parseFile(context);
        }

        return result.notes;
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  const aggregatedData = useMemo((): Omit<LibraryData, 'refresh'> => {
    let allNotes: UnifiedNote[] = [];

    parsedQueries.forEach(q => {
      if (q.data) {
        allNotes = [...allNotes, ...q.data];
      }
    });

    const booksMap = new Map<string, UnifiedBook>();

    allNotes.forEach(note => {
      const title = note.bookTitle || 'Unknown Book';

      if (!booksMap.has(title)) {
        booksMap.set(title, {
          title,
          author: (note.rawData as Record<string, unknown>)?.author as string | undefined,
          noteCount: 0,
          lastReading: note.createdAt,
          sourceApps: []
        });
      }

      const book = booksMap.get(title)!;
      book.noteCount++;
      if (note.createdAt > (book.lastReading || new Date(0))) {
        book.lastReading = note.createdAt;
      }
      if (!book.sourceApps.includes(note.sourceApp)) {
        book.sourceApps.push(note.sourceApp);
      }
    });

    return {
      notes: allNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      books: Array.from(booksMap.values()).sort((a, b) => (b.lastReading?.getTime() || 0) - (a.lastReading?.getTime() || 0)),
      isLoading: listQueries.some(q => q.isLoading) || parsedQueries.some(q => q.isLoading),
      errors: [...listQueries, ...parsedQueries].map(q => q.error).filter(Boolean) as Error[]
    };
  }, [listQueries, parsedQueries]);

  return {
    ...aggregatedData,
    refresh: () => {
      listQueries.forEach(q => q.refetch());
      parsedQueries.forEach(q => q.refetch());
    }
  };
}
