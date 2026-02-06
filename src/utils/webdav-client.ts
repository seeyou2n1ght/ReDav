/**
 * WebDAV 客户端实现
 * 封装 axios 实例和基础请求方法
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { encodeBasicAuth } from './auth';

/**
 * WebDAV 请求错误类型
 */
export class WebDAVError extends Error {
  statusCode?: number;
  originalError?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'WebDAVError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * 创建 WebDAV 客户端实例
 * @param config - WebDAV 连接配置（包含 webdav 和 proxy 配置）
 * @returns 配置好的 axios 实例
 */
export function createWebDAVClient(config: {
  webdav: { username: string; password: string };
  proxy: { token?: string };
}): AxiosInstance {
  const instance = axios.create({
    timeout: 30000,
  });

  // 请求拦截器：添加认证头和 Proxy 头
  instance.interceptors.request.use(
    (requestConfig) => {
      // 添加 Basic Auth 头
      const authHeader = encodeBasicAuth(config.webdav.username, config.webdav.password);
      requestConfig.headers.Authorization = authHeader;

      // 添加 Proxy 认证头（如果配置了 token）
      if (config.proxy.token) {
        requestConfig.headers['X-Proxy-Auth'] = config.proxy.token;
      }

      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器：统一错误处理
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const message = error.response?.data?.message || error.message || 'Unknown error';
        throw new WebDAVError(
          `WebDAV request failed: ${message}`,
          statusCode,
          error
        );
      }
      throw error;
    }
  );

  return instance;
}

/**
 * 构建 Proxy URL
 * @param proxyUrl - Proxy 服务器地址
 * @param targetUrl - 目标 WebDAV 完整 URL
 * @returns 代理请求的完整 URL
 */
function buildProxyUrl(proxyUrl: string, targetUrl: string): string {
  // 确保 proxyUrl 不以 / 结尾
  const baseUrl = proxyUrl.replace(/\/$/, '');
  // 对目标 URL 进行编码
  const encodedTarget = encodeURIComponent(targetUrl);
  return `${baseUrl}/proxy?target=${encodedTarget}`;
}

/**
 * 列出 WebDAV 目录内容
 * @param client - WebDAV 客户端实例
 * @param webdavBaseUrl - WebDAV 基础 URL
 * @param path - 目录路径（如 /notes）
 * @param proxyUrl - Proxy 服务器地址
 * @returns XML 格式的响应内容
 */
export async function listDirectory(
  client: AxiosInstance,
  webdavBaseUrl: string,
  path: string,
  proxyUrl: string
): Promise<string> {
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // 构建 WebDAV 完整 URL
  const webdavUrl = webdavBaseUrl + normalizedPath;
  // 构建 Proxy URL
  const url = buildProxyUrl(proxyUrl, webdavUrl);

  const config: AxiosRequestConfig = {
    method: 'PROPFIND',
    url,
    headers: {
      'Content-Type': 'application/xml',
      'Depth': '1', // 递归深度：0=仅当前，1=当前+直接子项，infinity=无限递归
    },
  };

  const response = await client.request(config);
  return response.data as string;
}

/**
 * 读取 WebDAV 文件内容
 * @param client - WebDAV 客户端实例
 * @param webdavBaseUrl - WebDAV 基础 URL
 * @param path - 文件路径（如 /notes/notes.json）
 * @param proxyUrl - Proxy 服务器地址
 * @returns 文件内容（文本格式）
 */
export async function readFile(
  client: AxiosInstance,
  webdavBaseUrl: string,
  path: string,
  proxyUrl: string
): Promise<string> {
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // 构建 WebDAV 完整 URL
  const webdavUrl = webdavBaseUrl + normalizedPath;
  // 构建 Proxy URL
  const url = buildProxyUrl(proxyUrl, webdavUrl);

  const config: AxiosRequestConfig = {
    method: 'GET',
    url,
  };

  const response = await client.request(config);
  return response.data as string;
}
