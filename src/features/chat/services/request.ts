import { apiConfig } from '../utils/apiConfig';

export const DEFAULT_REQUEST_TIMEOUT_MS = 20 * 60 * 1000;

type RequestModePayload = {
  url: string;
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

export const requestWithMode = async ({
  url,
  method,
  headers,
  body,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
}: RequestModePayload): Promise<Response> => {
  const mode = apiConfig.getRequestMode();
  const resolvedTimeout = Math.max(1_000, Math.min(timeoutMs, DEFAULT_REQUEST_TIMEOUT_MS));

  if (mode === 'server') {
    return fetchWithTimeout(
      '/api/proxy',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, method, headers, body, timeoutMs: resolvedTimeout }),
      },
      resolvedTimeout
    );
  }

  return fetchWithTimeout(
    url,
    {
      method,
      headers,
      body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    },
    resolvedTimeout
  );
};

