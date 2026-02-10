/**
 * WebDAV XML 响应解析工具函数
 * 用于解析 WebDAV PROPFIND 方法返回的 XML 响应
 */

import type { WebDAVItem } from '../types';

const DAV_NS = 'DAV:';

/**
 * 解析 WebDAV PROPFIND 响应的 XML 字符串
 * @param xml - WebDAV PROPFIND 返回的 XML 字符串
 * @returns 解析后的文件/目录列表
 */
export function parseWebDAVXml(xml: string): WebDAVItem[] {
  const items: WebDAVItem[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // 获取所有 response 节点
    let responses = doc.getElementsByTagNameNS(DAV_NS, 'response');

    if (responses.length === 0) {
      // 尝试不带命名空间的查询（兼容某些服务器）
      responses = doc.getElementsByTagName('response') as any; // 修正类型兼容性

      // 同时也尝试带前缀的 TagName，如果 DOMParser 没有正确处理 NS
      if (responses.length === 0) {
        responses = doc.getElementsByTagName('d:response') as any;
      }
    }

    console.log(`[WebDAV Parser] Found ${responses.length} response nodes`);

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];

      // 辅助函数：安全获取节点文本
      const getText = (ns: string, tag: string): string => {
        // 1. 尝试标准命名空间
        let el = response.getElementsByTagNameNS(ns, tag)[0];

        // 2. 尝试不带命名空间
        if (!el) {
          const tags = response.getElementsByTagName(tag);
          if (tags.length > 0) el = tags[0];
        }

        // 3. 尝试带 d: 前缀（常见的 WebDAV 前缀）
        if (!el) {
          const dTags = response.getElementsByTagName(`d:${tag}`);
          if (dTags.length > 0) el = dTags[0];
        }

        // 4. 尝试带 D: 前缀
        if (!el) {
          const bigDTags = response.getElementsByTagName(`D:${tag}`);
          if (bigDTags.length > 0) el = bigDTags[0];
        }

        return el?.textContent?.trim() || '';
      };

      // 提取 href (完整路径)
      const href = getText(DAV_NS, 'href');

      // 跳过根目录本身（通常为 / 或空）
      if (!href || href === '/' || href === '') {
        continue;
      }

      // 提取 displayname (文件名)
      const basename = getText(DAV_NS, 'displayname');

      // 如果没有 displayname，从 href 中提取文件名
      const filename = href;
      // 移除末尾的 /
      const cleanHref = href.replace(/\/$/, '');
      // 解码 URL 编码的文件名
      const decodedBasename = decodeURIComponent(cleanHref.split('/').pop() || '');
      const finalBasename = basename || decodedBasename || '';

      // 提取 lastmodified
      const lastmod = getText(DAV_NS, 'getlastmodified');

      // 提取 contentlength
      const contentLengthText = getText(DAV_NS, 'getcontentlength');
      const size = contentLengthText ? parseInt(contentLengthText, 10) : 0;

      // 判断类型（检查是否有 collection 节点）
      let type: 'file' | 'directory' = 'file';

      // 查找 resourcetype 节点
      let resourceTypeElement = response.getElementsByTagNameNS(DAV_NS, 'resourcetype')[0];
      if (!resourceTypeElement) resourceTypeElement = response.getElementsByTagName('resourcetype')[0];
      if (!resourceTypeElement) resourceTypeElement = response.getElementsByTagName('d:resourcetype')[0];
      if (!resourceTypeElement) resourceTypeElement = response.getElementsByTagName('D:resourcetype')[0];

      if (resourceTypeElement) {
        let collection = resourceTypeElement.getElementsByTagNameNS(DAV_NS, 'collection')[0];
        if (!collection) collection = resourceTypeElement.getElementsByTagName('collection')[0];
        if (!collection) collection = resourceTypeElement.getElementsByTagName('d:collection')[0];
        if (!collection) collection = resourceTypeElement.getElementsByTagName('D:collection')[0];

        if (collection) type = 'directory';
      }

      // 提取 etag（可选）
      const etag = getText(DAV_NS, 'getetag') || undefined;

      items.push({
        filename,
        basename: finalBasename,
        lastmod,
        size,
        type,
        etag,
      });
    }
  } catch (error) {
    console.error('Failed to parse WebDAV XML:', error);
    throw new Error(`Failed to parse WebDAV XML response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return items;
}
