/**
 * WebDAV 代理 - Cloudflare Pages Function
 * 处理 CORS，透传 Basic Auth，支持 X-Proxy-Auth 保护
 */

interface Env {
  PROXY_TOKEN?: string;
}

interface EventContext {
  request: Request;
  env: Env;
}

// Cloudflare Pages Function 导出格式
export async function onRequest(context: EventContext): Promise<Response> {
  const { request, env } = context;
  console.log(`[Proxy] ${request.method} ${request.url}`);

  // 添加 CORS 头的辅助函数
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, X-Proxy-Auth, Content-Type, Depth',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, PROPFIND',
  };

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const target = url.searchParams.get('target');

  // 验证 target 参数
  if (!target) {
    return new Response(
      JSON.stringify({ error: 'BadRequest', message: '缺少 target 参数' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // 验证 X-Proxy-Auth（如果配置了）
  const proxyAuth = request.headers.get('X-Proxy-Auth');
  if (env.PROXY_TOKEN && proxyAuth !== env.PROXY_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Forbidden', message: 'Proxy Token 验证失败' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // 构建转发请求的 Headers
  const forwardHeaders: Record<string, string> = {};

  // 透传 Authorization 头
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    forwardHeaders['Authorization'] = authHeader;
  }

  // 透传 Content-Type（PROPFIND 可能需要）
  const contentType = request.headers.get('Content-Type');
  if (contentType) {
    forwardHeaders['Content-Type'] = contentType;
  }

  // 透传 Depth 头（WebDAV PROPFIND 需要）
  const depthHeader = request.headers.get('Depth');
  if (depthHeader) {
    forwardHeaders['Depth'] = depthHeader;
  }

  try {
    // 向目标 WebDAV 服务器发起请求
    // 透传请求体（PROPFIND 可能包含 XML body）
    const response = await fetch(target, {
      method: request.method,
      headers: forwardHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined,
    });

    // 构造响应，添加 CORS 头
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // 删除可能导致问题的头
    responseHeaders.delete('set-cookie');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'BadGateway',
        message: error instanceof Error ? error.message : '请求目标服务器失败',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}
