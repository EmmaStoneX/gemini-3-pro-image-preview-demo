import type { UploadItem } from '../types';

const MAX_UPLOADS = 14;

export function limitUploads(existing: number, incoming: File[]): File[] {
  const available = MAX_UPLOADS - existing;
  return available > 0 ? incoming.slice(0, available) : [];
}

export function isImageFile(file: File | null | undefined): file is File {
  return !!file && typeof file.type === 'string' && file.type.startsWith('image/');
}

/**
 * Extract image files from a DataTransfer object (drag & drop / paste).
 * Safely handles missing data and filters non-image items via MIME type.
 */
export function extractFilesFromDataTransfer(dataTransfer: DataTransfer | null | undefined): File[] {
  if (!dataTransfer) return [];

  const { items, files } = dataTransfer;
  const images: File[] = [];
  const added = new Set<string>();

  if (items && items.length > 0) {
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile ? item.getAsFile() : null;
      if (isImageFile(file)) {
        const key = `${file.name}-${file.lastModified}-${file.size}`;
        if (!added.has(key)) {
          added.add(key);
          images.push(file);
        }
      }
    }
  }

  if (files && files.length > 0) {
    for (const file of Array.from(files)) {
      if (isImageFile(file)) {
        const key = `${file.name}-${file.lastModified}-${file.size}`;
        if (!added.has(key)) {
          added.add(key);
          images.push(file);
        }
      }
    }
  }

  return images;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function toUploadItems(files: File[]): Promise<UploadItem[]> {
  const loadImageSize = (dataUrl: string): Promise<{ width?: number; height?: number }> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: undefined, height: undefined });
      img.src = dataUrl;
    });

  const promises: Array<Promise<UploadItem>> = [];

  for (const file of files) {
    if (!isImageFile(file)) continue;
    const promise = (async () => {
      const dataUrl = await fileToBase64(file);
      const [, base64] = dataUrl.split(',');
      const { width, height } = await loadImageSize(dataUrl);
      const aspectRatio = width && height ? width / height : undefined;

      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        mimeType: file.type,
        base64,
        dataUrl,
        width,
        height,
        aspectRatio,
      };
    })();

    promises.push(promise);
  }

  return Promise.all(promises);
}
