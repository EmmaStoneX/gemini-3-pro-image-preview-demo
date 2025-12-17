# Gemini 3 Pro Image Preview Demo

基于 Gemini 3 Pro Image Preview API 的前端示例，提供「文本生成图片 / 多图合成 / 图片编辑」的一站式体验，使用 React 18 + Vite + Tailwind + Radix UI 构建。

**如果你遇到了网络失败问题，建议先查看API供应商的连通质量喵，可能不管我的事喵老大**

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
├─ api/
│  └─ proxy.cjs               // 服务端转发：解决浏览器 CORS，带白名单
├─ proxy.allowlist.json       // 服务端转发白名单（可直接修改）
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
│     ├─ services/request.ts   // 按请求方式 client/server 发起请求
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
   - 可选：在「请求方式」里选择 **客户端直连 / 服务端转发**。服务端转发可绕过浏览器 CORS，但会把 Key 发给服务端用于转发，详见弹窗风险提示。
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
- **联网搜索**：提供「联网生成」按钮，使用工具 `google_search` 增强生成。
- **思考过程帧**：可展开查看模型思考阶段返回的图片序列。
- **强制出图引导**：输入区提供开关，开启后会在 prompt 顶部追加引导语，尽量促使模型走图像生成工具/函数调用。
- **对话持久化**：自动把对话保存到本地，重新打开可「快速加载」。
- **删除消息**：任意气泡（系统/用户/助手）均可一键删除，便于清理报错消息。
- **下载与复制**：生成图可下载；用户气泡可复制为 Markdown（包含参考图 dataURL），文本回复支持一键复制，Markdown 渲染/GFM。
- **状态提示**：生成中提示预计耗时（1K≈1min / 2K≈5min / 4K≈10min），最长等待 20min；错误信息以系统消息形式展示。

## 配置说明
- 所有配置默认存储在浏览器 `localStorage`（如：`gemini_api_url`、`gemini_api_key`、`api_type`、`request_mode` 等）。
- **请求方式**
  - `client`（客户端直连）：浏览器直接请求你配置的 API URL；如果目标站点未开启 CORS，可能会出现跨域报错。
  - `server`（服务端转发）：前端请求站点自身的 `/api/proxy`，由服务端转发到目标 API（可绕过浏览器 CORS）。服务端不会保存 Key，但 Key 会随请求发给服务端用于转发。
- **服务端转发白名单**
  - 默认仅允许以下域名（HTTPS）：`www.packyapi.com`、`api-slb.packyapi.com`、`poloai.top`、`jp.duckcoding.com`、`www.galaapi.com`、`privnode.com`、`jp.privnode.com`、`privcoding.cc`。
  - 修改入口：编辑项目根目录 `proxy.allowlist.json` 后重新部署即可。
  - 也可通过环境变量覆盖（逗号分隔）：`PROXY_ALLOWLIST_HOSTNAMES`、`PROXY_ALLOWLIST_PROTOCOLS`。
- 清除或重置配置：在设置弹窗中点击「重置」即可。

## 注意事项
- 首次使用前必须在「设置」中填写 API URL 与 API Key，否则请求会被拒绝。
- API Key 保存在浏览器本地，请在受信任设备中使用并及时清理。
- 上传图片上限 14 张，大尺寸图片会以 base64 形式传输，可能增加带宽占用。
- 图片编辑仅在存在最近一次生成结果时可用；联网生成依赖外部搜索能力，可能增加时延。
- 若遇到类似 `blocked by CORS policy` 的报错，建议优先使用「服务端转发」或使用支持 CORS 的 API 域名。
- 建议使用现代浏览器（Chrome/Edge 115+），并确保网络允许访问所配置的 Endpoint。
