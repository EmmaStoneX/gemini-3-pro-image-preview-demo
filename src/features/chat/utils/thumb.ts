/**
 * Parse numeric or string aspect ratio (e.g. 1.78 or "16:9") into a number.
 * Falls back to 1 when input is invalid.
 */
function parseAspectRatio(input: number | string | undefined | null, fallback = 1): number {
  if (typeof input === 'number' && Number.isFinite(input) && input > 0) return input

  if (typeof input === 'string') {
    const trimmed = input.trim()

    // Direct numeric string, e.g. "1.78"
    const numeric = Number(trimmed)
    if (Number.isFinite(numeric) && numeric > 0) return numeric

    // Ratio string, e.g. "16:9"
    const parts = trimmed.split(':')
    if (parts.length === 2) {
      const w = Number(parts[0])
      const h = Number(parts[1])
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
        return w / h
      }
    }
  }

  return fallback
}

/**
 * Calculate thumbnail width/height while keeping the long edge at `maxEdge`.
 */
export function getThumbSize(aspectRatio: number | string | undefined, maxEdge: number) {
  const ratio = parseAspectRatio(aspectRatio, 1)
  if (ratio >= 1) {
    return { width: maxEdge, height: maxEdge / ratio }
  }
  return { width: maxEdge * ratio, height: maxEdge }
}

export { parseAspectRatio }
