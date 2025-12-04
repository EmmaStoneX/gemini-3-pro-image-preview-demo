export type UploadItem = {
  id: string
  name: string
  mimeType: string
  base64: string
  dataUrl: string
  width?: number
  height?: number
  aspectRatio?: number
}

export type ChatRole = "user" | "assistant" | "system"

export type ChatMessage = {
  id: string
  role: ChatRole
  text?: string
  images?: string[]           // 用户上传的参考图
  imageData?: string          // AI生成的图片 (base64)
  thinkingImages?: string[]   // 思考过程帧 (base64)
  isError?: boolean
  timestamp: string
}

// API相关类型
export type GeminiInlineData = {
  mime_type: string
  data: string
}

export type GeminiContentPart = {
  text?: string
  inline_data?: GeminiInlineData
  inlineData?: GeminiInlineData
  thought?: boolean
}

export type GeminiContent = {
  role: "user" | "model"
  parts: GeminiContentPart[]
}
