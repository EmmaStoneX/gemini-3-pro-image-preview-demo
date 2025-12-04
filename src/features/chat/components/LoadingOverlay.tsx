import { Loader2 } from "lucide-react"

type LoadingOverlayProps = {
  show: boolean
  message?: string
}

export function LoadingOverlay({ show, message = "正在生成图像，请稍候…" }: LoadingOverlayProps) {
  // 不显示时不渲染DOM
  if (!show) return null

  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-50"
      aria-hidden={false}
    >
      <div className="rounded-2xl bg-background/90 shadow-lg border px-6 py-4 flex items-center gap-3 backdrop-blur-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex flex-col">
          <span className="font-medium text-sm">{message}</span>
          <span className="text-xs text-muted-foreground">通常 10 秒完成，如有参数调整可能会更久</span>
        </div>
      </div>
    </div>
  )
}
