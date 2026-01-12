interface Env {
  API_KEY: string;
  API_BASE_URL?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let payload: {
    path: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    timeoutMs?: number;
  };

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: { message: '请求体必须为 JSON' } },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { path, method = 'POST', headers = {}, body, timeoutMs } = payload;

  if (!path || typeof path !== 'string') {
    return Response.json(
      { error: { message: '缺少 path 参数' } },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!env.API_KEY) {
    return Response.json(
      { error: { message: '请在 Cloudflare Pages 设置 API_KEY 环境变量' } },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const baseUrl = env.API_BASE_URL || 'https://api.zxvmax.com';
  const targetUrl = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;

  // 注入 API Key
  const finalHeaders: Record<string, string> = { ...headers };
  if (finalHeaders['x-goog-api-key']) {
    finalHeaders['x-goog-api-key'] = env.API_KEY;
  } else if (finalHeaders['Authorization']?.startsWith('Bearer ')) {
    finalHeaders['Authorization'] = `Bearer ${env.API_KEY}`;
  } else {
    finalHeaders['x-goog-api-key'] = env.API_KEY;
  }

  const requestTimeoutMs =
    typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0
      ? Math.min(timeoutMs, DEFAULT_TIMEOUT_MS)
      : DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: method.toUpperCase(),
      headers: finalHeaders,
      body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    const responseHeaders = new Headers(CORS_HEADERS);
    const contentType = response.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    return Response.json(
      { error: { message: isAbort ? '请求超时' : '网络请求失败' } },
      { status: isAbort ? 504 : 502, headers: CORS_HEADERS }
    );
  } finally {
    clearTimeout(timeoutId);
  }
};
