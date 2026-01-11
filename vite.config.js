import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000

// 开发环境 API 配置
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.zxvmax.com'
const API_KEY = process.env.API_KEY || ''

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const readJsonBody = async (req) => {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text) return {}
  return JSON.parse(text)
}

// 开发环境代理插件，模拟 Worker 行为
const apiProxyPlugin = () => ({
  name: 'local-api-proxy',
  configureServer(server) {
    server.middlewares.use('/api/proxy', async (req, res) => {
      setCorsHeaders(res)

      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }

      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: { message: 'Method Not Allowed' } }))
        return
      }

      let payload = {}
      try {
        payload = await readJsonBody(req)
      } catch {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: { message: '请求体必须为 JSON' } }))
        return
      }

      const { path: apiPath, method = 'POST', headers = {}, body, timeoutMs } = payload || {}
      
      if (!apiPath || typeof apiPath !== 'string') {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: { message: '缺少 path 参数' } }))
        return
      }

      if (!API_KEY) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: { message: '请设置 API_KEY 环境变量' } }))
        return
      }

      const targetUrl = `${API_BASE_URL}${apiPath.startsWith('/') ? apiPath : '/' + apiPath}`

      // 注入 API Key
      const finalHeaders = { ...headers }
      if (finalHeaders['x-goog-api-key']) {
        finalHeaders['x-goog-api-key'] = API_KEY
      } else if (finalHeaders['Authorization']?.startsWith('Bearer ')) {
        finalHeaders['Authorization'] = `Bearer ${API_KEY}`
      } else {
        finalHeaders['x-goog-api-key'] = API_KEY
      }

      const requestTimeoutMs =
        typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0
          ? Math.min(timeoutMs, DEFAULT_TIMEOUT_MS)
          : DEFAULT_TIMEOUT_MS

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs)

      try {
        const upstreamResponse = await fetch(targetUrl, {
          method: String(method || 'POST').toUpperCase(),
          headers: finalHeaders,
          body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
          signal: controller.signal,
        })

        res.statusCode = upstreamResponse.status
        const upstreamContentType = upstreamResponse.headers.get('content-type')
        res.setHeader('Content-Type', upstreamContentType || 'application/json; charset=utf-8')

        const text = await upstreamResponse.text()
        res.end(text)
      } catch (error) {
        const isAbort = error && typeof error === 'object' && error.name === 'AbortError'
        res.statusCode = isAbort ? 504 : 502
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: { message: isAbort ? '请求超时' : '网络请求失败' } }))
      } finally {
        clearTimeout(timeoutId)
      }
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
