export interface Env {
  API_KEY: string;
  API_BASE_URL: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return Response.json(
        { error: { message: 'Method Not Allowed' } },
        { status: 405, headers: CORS_HEADERS }
      );
    }

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

    const targetUrl = `${env.API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;

    // 注入 API Key
    const finalHeaders: Record<string, string> = { ...headers };
    if (finalHeaders['x-goog-api-key']) {
      finalHeaders['x-goog-api-key'] = env.API_KEY;
    } else if (finalHeaders['Authorization']?.startsWith('Bearer ')) {
      finalHeaders['Authorization'] = `Bearer ${env.API_KEY}`;
    } else {
      // 默认使用 x-goog-api-key
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
  },
};
