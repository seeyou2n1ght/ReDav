/**
 * MoonReader(静读天下) 适配器
 * 解析 .po 格式笔记文件
 */

import type { ReaderAdapter, UnifiedNote } from './types';

export const moonReaderAdapter: ReaderAdapter = {
  name: 'MoonReader',
  filePattern: /\.po$/,

  parse(_content: string): UnifiedNote[] {
    // TODO: 实现 .po 文件解析
    // .po 文件是 gettext 格式，需要解析 msgid/msgstr

    console.warn('MoonReader 适配器尚未实现');
    return [];
  },
};
