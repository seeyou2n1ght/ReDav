/**
 * 阅读器适配器统一导出
 */

import type { ReaderAdapter, ParseContext, ParseResult } from './types';
import { anxReaderAdapter } from './anx-reader-adapter';
import { moonReaderAdapter, type MoonReaderAdapterConfig } from './moon-reader-adapter';

export const adapters: ReaderAdapter[] = [
  anxReaderAdapter,
  moonReaderAdapter,
];

export function getRegisteredAdapters(): ReaderAdapter[] {
  return [...adapters];
}

export async function parseFile(context: ParseContext): Promise<ParseResult> {
  const adapter = adapters.find(a => a.filePattern.test(context.filename));
  if (!adapter) {
    throw new Error(`未找到适配器: ${context.filename}`);
  }
  return adapter.parse(context);
}

export type { ReaderAdapter, ParseContext, ParseResult, MoonReaderAdapterConfig };
