import { type MouseEvent, useEffect, useState } from 'react'
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

type ImageLightboxProps = {
  src: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageLightbox({ src, open, onOpenChange }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (open) {
      setZoom(100)
    }
  }, [open, src])

  const clampZoom = (value: number) => Math.min(300, Math.max(50, value))

  const handleZoomIn = () => setZoom((z) => clampZoom(z + 25))
  const handleZoomOut = () => setZoom((z) => clampZoom(z - 25))
  const handleImageClick = (event: MouseEvent<HTMLImageElement>) => {
    event.stopPropagation()
    handleZoomIn()
  }
  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  const handleClose = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className="fixed inset-0 bg-black/90 backdrop-blur-sm"
          onClick={handleClose}
        />
        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
            role="presentation"
          >
            <button
              aria-label="关闭预览"
              className="absolute right-6 top-6 rounded-full bg-black/70 p-2 text-white transition hover:bg-black/60"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative max-h-[85vh] max-w-[90vw]" onClick={handleContentClick}>
              <img
                src={src}
                alt="预览图片"
                className="max-h-[85vh] max-w-[90vw] select-none rounded-lg object-contain transition-transform duration-150 ease-out cursor-zoom-in"
                style={{ transform: `scale(${zoom / 100})` }}
                onClick={handleImageClick}
              />
            </div>

            <div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 transform"
              onClick={handleContentClick}
            >
              <div className="flex items-center gap-3 rounded-full bg-black/70 px-4 py-2 text-white shadow-lg">
                <button
                  className="rounded-full p-2 transition hover:bg-white/10 disabled:opacity-40"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  aria-label="缩小"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="w-16 text-center text-sm tabular-nums">{zoom}%</span>
                <button
                  className="rounded-full p-2 transition hover:bg-white/10 disabled:opacity-40"
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                  aria-label="放大"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogPortal>
    </Dialog>
  )
}
