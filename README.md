# Gemini Image Generator

基于 Gemini 的 AI 图片生成应用，支持文本生成图片、多图合成、图片编辑等功能。

## 一键部署到 Cloudflare

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/EmmaStoneX/gemini-3-pro-image-preview-demo)

部署后设置 API_KEY：
1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages
2. 找到 `gemini-image` → Settings → Variables
3. 添加变量 `API_KEY`，值为你的 API 密钥，类型选择 `Encrypt`

## 本地开发

1. 安装依赖
```bash
npm install
```

2. 创建 `.env.local` 文件
```
API_KEY=your_api_key
API_BASE_URL=https://api.zxvmax.com
```

3. 启动开发服务器
```bash
npm run dev
```

## 手动部署

```bash
# 安装 worker 依赖
cd worker
npm install

# 部署（会自动构建前端）
npm run deploy
```

## 功能特性

- 文本生成图片（支持多种宽高比）
- 多图上传与合成（最多 14 张）
- 图片编辑（基于上一张生成结果）
- 联网搜索增强生成
- 对话历史持久化
- Markdown 渲染

## 技术栈

- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI
- Cloudflare Workers
