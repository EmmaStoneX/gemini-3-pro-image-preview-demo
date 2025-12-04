const MAX_UPLOADS = 14;

export function limitUploads(existing, incoming) {
  const available = MAX_UPLOADS - existing;
  return available > 0 ? incoming.slice(0, available) : [];
}

export function isImageFile(file) {
  return file && file.type && file.type.startsWith('image/');
}

/**
 * Extract image files from a DataTransfer object (drag & drop / paste).
 * Safely handles missing data and filters non-image items via MIME type.
 * @param {DataTransfer | null | undefined} dataTransfer
 * @returns {File[]} Image files contained in the DataTransfer payload
 */
export function extractFilesFromDataTransfer(dataTransfer) {
  if (!dataTransfer) return [];

  const { items, files } = dataTransfer;
  const images = [];
  const added = new Set();

  if (items && items.length > 0) {
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile ? item.getAsFile() : null;
      if (file && isImageFile(file)) {
        const key = `${file.name}-${file.lastModified}-${file.size}`;
        if (!added.has(key)) {
          added.add(key);
          images.push(file);
        }
      }
    }
  }

  if (files && files.length > 0) {
    for (const file of files) {
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

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function toUploadItems(files) {
  const loadImageSize = (dataUrl) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: undefined, height: undefined });
      img.src = dataUrl;
    });

  const promises = [];

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
