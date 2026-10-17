/** Opciones para reducir una imagen antes de subirla a Storage. */
export interface ImageCompressionOptions {
  /** Tamaño máximo del archivo resultante, en bytes. */
  maxBytes: number
  /** Lado mayor máximo, en píxeles. */
  maxDimension: number
  /** Tipo de salida; por defecto WebP. */
  mimeType?: 'image/webp' | 'image/jpeg'
  /** Calidades que se prueban en orden hasta caber en `maxBytes`. */
  qualities?: readonly number[]
}

const DEFAULT_QUALITIES = [0.86, 0.76, 0.66, 0.56] as const

/**
 * Redimensiona y recomprime una imagen para que no supere `maxBytes`.
 * Si el original ya cabe y no excede `maxDimension`, se devuelve sin cambios.
 * Rechaza la promesa cuando el archivo no es una imagen o no se consigue reducir.
 */
export async function compressImage(file: File, options: ImageCompressionOptions): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('image_compression_invalid_type')

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, options.maxDimension / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= options.maxBytes) return file

    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('image_compression_canvas_unavailable')
    context.drawImage(bitmap, 0, 0, width, height)

    const mimeType = options.mimeType ?? 'image/webp'
    for (const quality of options.qualities ?? DEFAULT_QUALITIES) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, quality))
      if (blob && blob.size <= options.maxBytes) {
        const extension = blob.type === 'image/jpeg' ? 'jpg' : 'webp'
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
        return new File([blob], `${baseName}.${extension}`, {type: blob.type || mimeType})
      }
    }
    throw new Error('image_compression_too_large')
  } finally {
    bitmap.close()
  }
}
