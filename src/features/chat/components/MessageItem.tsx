import { useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Copy, Check } from 'lucide-react'
import { ImageLightbox } from '@/components/ImageLightbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/features/chat/types'
import { getThumbSize } from '../utils/thumb'

const USER_IMAGE_MAX_EDGE = 80

const markdownComponents: Components = {
  a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
  code(
    { inline, className, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode } & HTMLAttributes<HTMLElement>,
  ) {
    if (inline) {
      return (
        <code className={cn("rounded bg-muted px-1 py-0.5 text-xs font-medium", className)} {...props}>
          {children}
        </code>
      )
    }

    return (
      <pre className="overflow-x-auto rounded-lg bg-muted px-3 py-2 text-sm">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    )
  },
}

function getDisplayParts(message: ChatMessage, includeThinking: boolean) {
  if (message.parts && message.parts.length > 0) {
    const nonThoughtParts = message.parts.filter((p) => !p.thought)
    const thoughtParts = message.parts.filter((p) => p.thought)
    const combined = includeThinking ? message.parts : nonThoughtParts
    return combined
  }
  if (message.text) return [{ text: message.text }]
  return []
}

function UploadedThumb({ src, alt }: { src: string; alt: string }) {
  const [ratio, setRatio] = useState(1)
  const size = getThumbSize(ratio, USER_IMAGE_MAX_EDGE)

  return (
    <div
      className="relative shrink-0 rounded-md border bg-background overflow-hidden flex items-center justify-center"
      style={size}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget
          if (naturalWidth && naturalHeight) {
            const nextRatio = naturalWidth / naturalHeight
            if (nextRatio !== ratio) setRatio(nextRatio)
          }
        }}
      />
    </div>
  )
}

type MessageItemProps = {
  message: ChatMessage
  includeThinking: boolean
  onDownload: (base64: string) => void
}

export function MessageItem({ message, includeThinking, onDownload }: MessageItemProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const handleCopy = () => {
    const displayParts = getDisplayParts(message, includeThinking)
    const hasStructured = Boolean(message.parts?.length)
    const copyText = hasStructured
      ? displayParts.map((p) => p.text).filter(Boolean).join('\n\n')
      : message.text
    if (!copyText) return

    navigator.clipboard.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayParts = getDisplayParts(message, includeThinking)

  return (
    <div className={cn("flex flex-col gap-1 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "items-end" : "items-start")}>
      {/* 用户名和时间戳 */}
      <div className={cn("flex items-center gap-2 px-1", isUser ? "flex-row-reverse" : "")}>
        <span className="text-xs text-muted-foreground font-medium">{isUser ? "你" : "Gemini"}</span>
        <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>

      {/* 消息气泡 */}
      <div
        className={cn(
          "rounded-2xl p-4 shadow-sm max-w-[90%] sm:max-w-[85%]",
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-card border rounded-tl-sm",
          message.isError ? "bg-destructive/10 border-destructive text-destructive" : "",
        )}
      >
        {/* 文本内容 + 复制按钮 */}
        {displayParts.length > 0 && (
          <div className="relative group/text">
            <div className="space-y-3">
              {displayParts.map((part, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "prose prose-sm prose-neutral dark:prose-invert max-w-none",
                    isUser && "prose-invert"
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
            {!isUser && (
              <button
                onClick={handleCopy}
                className="absolute -right-2 -top-2 opacity-0 group-hover/text:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity rounded"
                aria-label="复制文本"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </div>
        )}

        {/* 用户上传的参考图 */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.images.map((img, i) => (
              <UploadedThumb key={i} src={img} alt="uploaded" />
            ))}
          </div>
        )}

        {/* 思考过程 (可折叠) */}
        {message.thinkingImages && message.thinkingImages.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <details className="group/thinking">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 select-none">
                <span className="bg-muted px-2 py-0.5 rounded-full">🧠 思考过程</span>
                <span className="opacity-0 group-hover/thinking:opacity-100 transition-opacity text-[10px]">点击展开 {message.thinkingImages.length} 帧</span>
              </summary>
              <div className="flex overflow-x-auto gap-2 py-2 mt-2 pb-4 custom-scrollbar">
                {message.thinkingImages.map((img, i) => (
                  <img
                    key={i}
                    src={`data:image/png;base64,${img}`}
                    className="h-32 w-auto rounded-lg border shadow-sm flex-shrink-0"
                    alt={`thinking-${i}`}
                  />
                ))}
              </div>
            </details>
          </div>
        )}

        {/* AI生成的图片 */}
        {message.imageData && (
          <>
            <div className="mt-3 relative group" onClick={() => setLightboxOpen(true)}>
              <img
                src={`data:image/png;base64,${message.imageData}`}
                alt="generated"
                className="w-full h-auto max-w-md rounded-xl border shadow-sm bg-muted/10 min-h-[100px] cursor-pointer hover:brightness-95"
              />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    onDownload(message.imageData!)
                  }}
                  title="下载图片"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ImageLightbox
              src={`data:image/png;base64,${message.imageData}`}
              open={lightboxOpen}
              onOpenChange={setLightboxOpen}
            />
          </>
        )}
      </div>
    </div>
  )
}
