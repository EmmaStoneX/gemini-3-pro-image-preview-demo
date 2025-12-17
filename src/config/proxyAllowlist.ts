import allowlist from '../../proxy.allowlist.json'

type AllowlistConfig = {
  protocols?: string[]
  hostnames?: string[]
}

const normalizeProtocol = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.endsWith(':') ? trimmed : `${trimmed}:`
}

const config = (allowlist || {}) as AllowlistConfig

export const allowedProxyProtocols = new Set(
  (config.protocols || []).map((p) => normalizeProtocol(String(p))).filter(Boolean),
)

export const allowedProxyHostnames = new Set(
  (config.hostnames || []).map((h) => String(h).trim().toLowerCase()).filter(Boolean),
)

export const allowedProxyBaseUrls = Array.from(allowedProxyHostnames).map((hostname) => `https://${hostname}`)

export const isAllowedProxyTargetUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return allowedProxyProtocols.has(url.protocol) && allowedProxyHostnames.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

