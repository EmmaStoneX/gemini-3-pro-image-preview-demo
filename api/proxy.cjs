const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;
const DEFAULT_ALLOWED_HOSTNAMES = [
  'www.packyapi.com',
  'api-slb.packyapi.com',
  'poloai.top',
  'jp.duckcoding.com',
  'www.galaapi.com',
  'privnode.com',
  'jp.privnode.com',
  'privcoding.cc',
];
const DEFAULT_ALLOWED_PROTOCOLS = ['https:'];

const parseList = (raw) =>
  String(raw || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const normalizeProtocol = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith(':') ? trimmed : `${trimmed}:`;
};

const loadAllowlistFromFile = () => {
  try {
    const configPath = path.join(__dirname, '..', 'proxy.allowlist.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);

    const hostnames = Array.isArray(parsed?.hostnames) ? parsed.hostnames.filter((h) => typeof h === 'string') : [];
    const protocols = Array.isArray(parsed?.protocols) ? parsed.protocols.filter((p) => typeof p === 'string') : [];

    return {
      hostnames: hostnames.map((h) => h.trim().toLowerCase()).filter(Boolean),
      protocols: protocols.map(normalizeProtocol).filter(Boolean),
    };
  } catch {
    return null;
  }
};

const resolveAllowlist = () => {
  const envHostnames = parseList(process.env.PROXY_ALLOWLIST_HOSTNAMES || process.env.PROXY_ALLOWED_HOSTNAMES);
  const envProtocols = parseList(process.env.PROXY_ALLOWLIST_PROTOCOLS);
  const fileConfig = loadAllowlistFromFile();

  const hostnames =
    envHostnames.length > 0
      ? envHostnames.map((h) => h.toLowerCase())
      : fileConfig?.hostnames?.length
        ? fileConfig.hostnames
        : DEFAULT_ALLOWED_HOSTNAMES;

  const protocols =
    envProtocols.length > 0
      ? envProtocols.map(normalizeProtocol)
      : fileConfig?.protocols?.length
        ? fileConfig.protocols
        : DEFAULT_ALLOWED_PROTOCOLS;

  return {
    hostnames: new Set(hostnames.map((h) => h.trim().toLowerCase()).filter(Boolean)),
    protocols: new Set(protocols.map(normalizeProtocol).filter(Boolean)),
  };
};

const { hostnames: ALLOWED_HOSTNAMES, protocols: ALLOWED_PROTOCOLS } = resolveAllowlist();

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    const err = new Error('Invalid JSON body');
    err.cause = error;
    throw err;
  }
};

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isAllowedTarget = (value) => {
  if (!isHttpUrl(value)) return false;
  try {
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.has(url.protocol) && ALLOWED_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
};

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: { message: 'Method Not Allowed' } }));
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: { message: '请求体必须为 JSON' } }));
    return;
  }

  const { url, method = 'POST', headers = {}, body, timeoutMs } = payload || {};

  if (!url || typeof url !== 'string') {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: { message: '非法的目标 URL' } }));
    return;
  }

  if (!isAllowedTarget(url)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: { message: '目标 URL 不在允许列表中' } }));
    return;
  }

  const requestTimeoutMs =
    typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0
      ? Math.min(timeoutMs, DEFAULT_TIMEOUT_MS)
      : DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const upstreamResponse = await fetch(url, {
      method: String(method || 'POST').toUpperCase(),
      headers: headers && typeof headers === 'object' ? headers : {},
      body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    res.statusCode = upstreamResponse.status;

    const upstreamContentType = upstreamResponse.headers.get('content-type');
    if (upstreamContentType) {
      res.setHeader('Content-Type', upstreamContentType);
    } else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    const text = await upstreamResponse.text();
    res.end(text);
  } catch (error) {
    const isAbort = error && typeof error === 'object' && error.name === 'AbortError';
    res.statusCode = isAbort ? 504 : 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: {
          message: isAbort ? '请求超时' : '网络请求失败',
        },
      })
    );
  } finally {
    clearTimeout(timeoutId);
  }
};
