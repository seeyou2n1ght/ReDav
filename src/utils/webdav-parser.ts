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
    const responses = doc.getElementsByTagNameNS(DAV_NS, 'response');
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      
      // 提取 href (完整路径)
      const hrefElement = response.getElementsByTagNameNS(DAV_NS, 'href')[0];
      const href = hrefElement?.textContent?.trim() || '';
      
      // 跳过根目录本身（通常为 / 或空）
      if (!href || href === '/' || href === '') {
        continue;
      }
      
      // 提取 displayname (文件名)
      const displayNameElement = response.getElementsByTagNameNS(DAV_NS, 'displayname')[0];
      const basename = displayNameElement?.textContent?.trim() || '';
      
      // 如果没有 displayname，从 href 中提取文件名
      const filename = href;
      const finalBasename = basename || filename.split('/').filter(Boolean).pop() || '';
      
      // 提取 lastmodified
      const lastModifiedElement = response.getElementsByTagNameNS(DAV_NS, 'getlastmodified')[0];
      const lastmod = lastModifiedElement?.textContent?.trim() || '';
      
      // 提取 contentlength
      const contentLengthElement = response.getElementsByTagNameNS(DAV_NS, 'getcontentlength')[0];
      const size = contentLengthElement?.textContent ? parseInt(contentLengthElement.textContent, 10) : 0;
      
      // 判断类型（检查是否有 collection 节点）
      const resourceTypeElement = response.getElementsByTagNameNS(DAV_NS, 'resourcetype')[0];
      const collectionElement = resourceTypeElement?.getElementsByTagNameNS(DAV_NS, 'collection')[0];
      const type = collectionElement ? 'directory' : 'file';
      
      // 提取 etag（可选）
      const etagElement = response.getElementsByTagNameNS(DAV_NS, 'getetag')[0];
      const etag = etagElement?.textContent?.trim() || undefined;
      
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
