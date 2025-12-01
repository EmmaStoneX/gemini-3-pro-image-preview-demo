import { useRef, useState } from 'react'
import { Search, Send, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UploadStrip } from './UploadStrip'
import { ControlBar } from './ControlBar'
import type { UploadItem } from '@/features/chat/types'
import { cn } from '@/lib/utils'

type PromptPanelProps = {
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (mode?: "generate" | "edit" | "search") => void
  loading: boolean
  uploads: UploadItem[]
  onAddFiles: (files?: FileList | File[] | null) => Promise<void>
  onRemoveUpload: (id: string) => void
  aspectRatio: string
  imageSize: string
  includeThinking: boolean
  onAspectChange: (value: string) => void
  onSizeChange: (value: string) => void
  onToggleThinking: (value: boolean) => void
  canEditLast: boolean
  onEditLast: () => void
}

export function PromptPanel({
  prompt,
  onPromptChange,
  onSend,
  loading,
  uploads,
  onAddFiles,
  onRemoveUpload,
  aspectRatio,
  imageSize,
  includeThinking,
  onAspectChange,
  onSizeChange,
  onToggleThinking,
  canEditLast,
  onEditLast,
}: PromptPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleIncomingFiles = async (files?: FileList | File[]) => {
    if (files && files.length > 0) {
      await onAddFiles(files)
    }
  }

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    await handleIncomingFiles(files || undefined)
    if (event.target) event.target.value = ""
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend("generate")
    }
  }

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 pb-4">
      <div
        className="pointer-events-auto max-w-5xl w-[92vw] mx-auto border rounded-2xl shadow-lg bg-background/95 backdrop-blur p-4 space-y-4"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDrop={async (e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer?.files?.length) {
            await handleIncomingFiles(e.dataTransfer.files)
          }
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFiles}
        />

        <UploadStrip uploads={uploads} onRemove={onRemoveUpload} />

        {/* 集成式输入框 */}
        <div
          className={cn(
            "relative rounded-2xl border bg-muted/40 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/20 transition-all duration-200",
            isDragging && "ring-2 ring-primary/60 bg-primary/5"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              onPromptChange(e.target.value)
              adjustHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder="描述您想生成的图像..."
            className="min-h-[60px] max-h-[200px] w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-4 pb-12 placeholder:text-muted-foreground/50"
          />

          {/* 底部按钮栏 */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground",
                  uploads.length > 0 && "text-primary bg-primary/10"
                )}
                onClick={() => fileInputRef.current?.click()}
                title="上传参考图"
              >
                <Plus className="h-5 w-5" />
              </Button>
              {uploads.length > 0 && (
                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  {uploads.length} 张图片
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => onSend("search")}
                disabled={loading}
                title="联网生成"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onSend("generate")}
                disabled={loading || (!prompt && uploads.length === 0)}
                size="sm"
                className="h-8 px-3 rounded-lg transition-all"
              >
                {loading ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <>
                    <span className="mr-2 hidden sm:inline">生成</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <ControlBar
          aspectRatio={aspectRatio}
          imageSize={imageSize}
          includeThinking={includeThinking}
          onAspectChange={onAspectChange}
          onSizeChange={onSizeChange}
          onToggleThinking={onToggleThinking}
          onEdit={onEditLast}
          canEdit={canEditLast}
          loading={loading}
        />
      </div>
    </div>
  )
}
