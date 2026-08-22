export type ImageCropMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface ImageCropperConfig {
  aspectRatio?: number
  maxOutputWidth?: number
  maxOutputHeight?: number
  outputMimeType?: ImageCropMimeType
  outputQuality?: number
  altText?: string
}

export interface ImageCropResult {
  blob: Blob
  width: number
  height: number
  mimeType: string
}

export interface ResolvedImageCropperConfig {
  aspectRatio: number
  maxOutputWidth: number
  maxOutputHeight: number
  outputMimeType: ImageCropMimeType
  outputQuality: number
  altText: string
}
