# Gemini Image Generator

基于 Gemini 的 AI 图片生成应用，支持文本生成图片、多图合成、图片编辑等功能。

## 部署到 Cloudflare Pages

### 1. Fork 本仓库

点击右上角 Fork 按钮，将仓库 fork 到你的 GitHub 账号。

### 2. 创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选择你 fork 的仓库
4. 构建设置：
   - 框架预设：`None`
   - 构建命令：`npm run build`
   - 输出目录：`dist`

### 3. 设置环境变量

在 Pages 项目的 **Settings** → **Environment variables** 中添加：

| 变量名 | 值 | 类型 |
|--------|-----|------|
| `API_KEY` | 你的 API 密钥 | Encrypt |
| `API_BASE_URL` | `https://api.zxvmax.com`（可选） | Plain text |

### 4. 部署

保存后点击 **Save and Deploy**，等待构建完成即可访问。

之后每次推送代码到 GitHub，Cloudflare 会自动触发构建部署。

---

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
- Cloudflare Pages + Functions
