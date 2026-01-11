# Gemini Image Generator

基于 Gemini 2.0 Flash 的 AI 图片生成应用，支持文本生成图片、多图合成、图片编辑等功能。

## 一键部署

### 部署 Worker（后端代理）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/YOUR_REPO&authed=true&fields={"API_KEY":"你的API密钥"}&apiTokenTmpl=[{"key":"API_KEY","type":"secret"}])

部署后需要设置 Secret：
```bash
cd worker
npx wrangler secret put API_KEY
# 输入你的 API Key
```

### 部署前端（Cloudflare Pages）

[![Deploy to Cloudflare Pages](https://deploy.pages.dev/button)](https://deploy.pages.dev/?url=https://github.com/YOUR_USERNAME/YOUR_REPO)

部署时设置：
- 构建命令：`npm run build`
- 输出目录：`dist`
- 环境变量：`VITE_WORKER_URL` = 你的 Worker 地址（如 `https://gemini-image-proxy.your-account.workers.dev`）

## 本地开发

1. 安装依赖
```bash
npm install
```

2. 设置环境变量
```bash
# Windows
set API_KEY=your_api_key

# Linux/Mac
export API_KEY=your_api_key
```

3. 启动开发服务器
```bash
npm run dev
```

## 项目结构

```
├── src/                    # 前端源码
│   ├── features/chat/      # 聊天功能模块
│   └── components/         # 通用组件
├── worker/                 # Cloudflare Worker 代理
│   ├── src/index.ts        # Worker 入口
│   └── wrangler.toml       # Worker 配置
└── dist/                   # 构建输出
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
- Cloudflare Workers + Pages
