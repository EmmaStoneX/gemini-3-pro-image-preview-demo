// 所有请求都通过后端 Worker 代理

export const DEFAULT_REQUEST_TIMEOUT_MS = 20 * 60 * 1000;

// Worker API 地址，生产环境通过环境变量配置
const getWorkerUrl = (): string => {
  // @ts-expect-error Vite 环境变量
  return import.meta.env.VITE_WORKER_URL || '/api/proxy';
};

type RequestPayload = {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const requestViaWorker = async ({
  path,
  method,
  headers,
  body,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
}: RequestPayload): Promise<Response> => {
  const resolvedTimeout = Math.max(1_000, Math.min(timeoutMs, DEFAULT_REQUEST_TIMEOUT_MS));

  return fetchWithTimeout(
    getWorkerUrl(),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, method, headers, body, timeoutMs: resolvedTimeout }),
    },
    resolvedTimeout
  );
};
