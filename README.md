# Gemini 3 Pro Image Preview Demo

基于 Gemini 3 Pro Image Preview API 的前端示例，提供「文本生成图片 / 多图合成 / 图片编辑」的一站式体验，使用 React 18 + Vite + Tailwind + Radix UI 构建。

## 目录
- [项目简介](#项目简介)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [功能特性](#功能特性)
- [配置说明](#配置说明)
- [开发指南](#开发指南)
- [部署说明（Vercel）](#部署说明vercel)
- [架构设计](#架构设计)
- [注意事项](#注意事项)

## 项目简介
- **核心功能**：文本/多图生成、上一张图片编辑、联网搜索增强、图片下载与 Markdown 回复展示。
- **技术栈**：React 18、TypeScript、Vite 5、Tailwind CSS、Radix UI、lucide-react、react-markdown + remark-gfm。
- **适用场景**：需要快速验证 Gemini 3 Pro Image Preview 模型的 Web 端交互与配置体验。

## 目录结构
```
.
├─ src/
│  ├─ main.tsx                // React 挂载入口
│  ├─ App.tsx                 // 应用根组件与布局
│  ├─ index.css               // 全局样式（Tailwind）
│  ├─ lib/utils.ts            // 通用工具（类名合并）
│  ├─ types/gemini.ts         // Gemini 请求/响应类型
│  └─ features/chat/
│     ├─ components/          // ChatHeader、PromptPanel、MessageList 等 UI 组件
│     ├─ hooks/useChatSession.ts // 状态管理与业务动作
│     ├─ services/geminiClient.ts // Gemini API 调用封装
│     ├─ utils/               // apiConfig、files、session、thumb 等小工具
│     └─ types.ts             // 聊天领域模型类型
├─ components/                // 通用组件（ImageLightbox、UI 基础件）
├─ index.html                 // Vite HTML 模板
├─ vite.config.js             // Vite 配置与别名
├─ tailwind.config.js         // Tailwind 设计令牌
├─ tsconfig.json              // TS 编译与路径别名(@/*)
├─ vercel.json                // Vercel 构建与输出配置
└─ package.json               // 脚本与依赖
```

## 快速开始
1. **环境要求**
   - Node.js ≥ 18（Vite 5 需求），npm 10+。
2. **安装依赖**
   ```bash
   npm install
   ```
3. **本地开发**
   ```bash
   npm run dev
   # 默认 http://localhost:5173
   ```
4. **首次配置（必做）**
   - 打开页面右上角齿轮「设置」。
   - 填写 **API URL**（默认示例：`https://www.packyapi.com`）与 **API Key**。
   - 可选：开启「联网搜索」开关以在生成时允许搜索增强。
   - 配置保存在浏览器 `localStorage`。
5. **生产构建与预览**
   ```bash
   npm run build
   npm run preview   # 本地预览 dist
   ```
6. **类型检查（建议）**
   ```bash
   npx tsc --noEmit
   ```

## 功能特性
- 文本生成图片，支持 1:1 / 16:9 / 4:3 / 3:4 / 9:16 / 5:4 宽高比。
- 图片尺寸可选 1K / 2K / 4K。
- **多图上传与合成**：拖拽、粘贴或选择图片，最多 14 张；可查看缩略图。
- **图片编辑**：基于上一张生成结果继续编辑。
- **联网搜索**：可选启用工具 `google_search` 以增强生成。
- **思考过程帧**：可展开查看模型思考阶段返回的图片序列。
- **下载与复制**：生成图可下载，文本回复支持一键复制，Markdown 渲染/GFM。
- **状态提示**：生成中动画、错误信息以系统消息形式展示。

## 配置说明
- 所有配置存储在浏览器 `localStorage`（键：`gemini_api_url`、`gemini_api_key`、`gemini_web_search`），不经由服务器保存。
- API 请求路径固定为：`{API_URL}/v1beta/models/gemini-3-pro-image-preview:generateContent`，并自动添加 `x-goog-api-key` 头。
- 若使用自建代理，请确保：
  - 代理地址允许跨域访问（CORS）。
  - POST body 透传至 Gemini 接口，保持 `Content-Type: application/json`。
- 清除或重置配置：在设置弹窗中点击「重置」即可。

## 注意事项
- 首次使用前必须在「设置」中填写 API URL 与 API Key，否则请求会被拒绝。
- API Key 保存在浏览器本地，请在受信任设备中使用并及时清理。
- 上传图片上限 14 张，大尺寸图片会以 base64 形式传输，可能增加带宽占用。
- 图片编辑仅在存在最近一次生成结果时可用；联网生成依赖外部搜索能力，可能增加时延。
- 建议使用现代浏览器（Chrome/Edge 115+），并确保网络允许访问所配置的 Gemini Endpoint。
