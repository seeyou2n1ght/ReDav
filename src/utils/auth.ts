/**
 * Basic Auth 编码工具函数
 * 用于将用户名和密码编码为 Base64 格式的 Authorization 头
 */

/**
 * 将用户名和密码编码为 Basic Auth 格式
 * @param username - WebDAV 用户名
 * @param password - WebDAV 密码
 * @returns Base64 编码的认证字符串（格式：Basic <base64>）
 */
export function encodeBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const base64Credentials = btoa(credentials);
  return `Basic ${base64Credentials}`;
}
