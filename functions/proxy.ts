/**
 * WebDAV 代理
 * 处理 CORS，透传 Basic Auth，支持 X-Proxy-Auth 保护
 */

export interface Env {
  PROXY_TOKEN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get('target');

  // 验证 target 参数
  if (!target) {
    return new Response(
      JSON.stringify({ error: 'BadRequest', message: '缺少 target 参数' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 验证 X-Proxy-Auth（如果配置了）
  const proxyAuth = request.headers.get('X-Proxy-Auth');
  if (env.PROXY_TOKEN && proxyAuth !== env.PROXY_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Forbidden', message: 'Proxy Token 验证失败' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 透传 Authorization 头
  const authHeader = request.headers.get('Authorization');
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    // 向目标 WebDAV 服务器发起请求
    const response = await fetch(target, {
      method: request.method,
      headers,
    });

    // 构造响应，添加 CORS 头
    const corsHeaders = new Headers(response.headers);
    corsHeaders.set('Access-Control-Allow-Origin', '*');
    corsHeaders.set('Access-Control-Allow-Headers', 'Authorization, X-Proxy-Auth');
    corsHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    // 删除可能导致问题的头
    corsHeaders.delete('set-cookie');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'BadGateway', 
        message: error instanceof Error ? error.message : '请求目标服务器失败' 
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
