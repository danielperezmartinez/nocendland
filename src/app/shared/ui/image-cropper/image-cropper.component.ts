import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core'
import {
  ImageCropResult,
  ImageCropperConfig,
  ResolvedImageCropperConfig,
} from './image-cropper.models'

interface Size {
  width: number
  height: number
}

interface Point {
  x: number
  y: number
}

const DEFAULT_CONFIG: ResolvedImageCropperConfig = {
  aspectRatio: 1,
  maxOutputWidth: 1024,
  maxOutputHeight: 1024,
  outputMimeType: 'image/webp',
  outputQuality: 0.86,
  altText: 'Ajustar encuadre de la imagen',
}

@Component({
  selector: 'app-image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrl: './image-cropper.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ImageCropperComponent implements OnDestroy {
  readonly source = input.required<Blob | string>()
  readonly config = input<ImageCropperConfig>({})
  readonly confirmed = output<ImageCropResult>()
  readonly cancelled = output<void>()

  protected readonly sourceUrl = signal('')
  protected readonly loading = signal(true)
  protected readonly processing = signal(false)
  protected readonly error = signal<string | null>(null)
  protected readonly zoom = signal(1)
  protected readonly offset = signal<Point>({x: 0, y: 0})
  protected readonly imageSize = signal<Size>({width: 0, height: 0})
  protected readonly viewportSize = signal<Size>({width: 0, height: 0})
  protected readonly resolvedConfig = computed<ResolvedImageCropperConfig>(() => {
    const config = this.config()
    return {
      aspectRatio: this.positive(config.aspectRatio, DEFAULT_CONFIG.aspectRatio),
      maxOutputWidth: Math.round(this.positive(config.maxOutputWidth, DEFAULT_CONFIG.maxOutputWidth)),
      maxOutputHeight: Math.round(this.positive(config.maxOutputHeight, DEFAULT_CONFIG.maxOutputHeight)),
      outputMimeType: config.outputMimeType ?? DEFAULT_CONFIG.outputMimeType,
      outputQuality: Math.min(1, Math.max(0, config.outputQuality ?? DEFAULT_CONFIG.outputQuality)),
      altText: config.altText?.trim() || DEFAULT_CONFIG.altText,
    }
  })
  protected readonly viewportAspectRatio = computed(() => String(this.resolvedConfig().aspectRatio))
  protected readonly displayedImageSize = computed<Size>(() => {
    const viewport = this.viewportSize()
    const image = this.imageSize()
    if (!viewport.width || !viewport.height || !image.width || !image.height) return {width: 0, height: 0}
    const baseScale = Math.max(viewport.width / image.width, viewport.height / image.height)
    const scale = baseScale * this.zoom()
    return {width: image.width * scale, height: image.height * scale}
  })
  protected readonly imageTransform = computed(() => {
    const offset = this.offset()
    return `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`
  })

  @ViewChild('viewport') private viewport?: ElementRef<HTMLElement>

  private dragPointerId: number | null = null
  private lastPointer: Point | null = null
  private ownedSourceUrl: string | null = null

  constructor() {
    effect(() => this.setSource(this.source()))
  }

  ngOnDestroy(): void {
    this.revokeOwnedSourceUrl()
  }

  protected onImageLoaded(event: Event): void {
    const image = event.target as HTMLImageElement
    this.imageSize.set({width: image.naturalWidth, height: image.naturalHeight})
    this.updateViewportSize()
    this.reset()
    this.loading.set(false)
    this.error.set(null)
  }

  protected onImageError(): void {
    this.loading.set(false)
    this.error.set('No se ha podido leer la imagen seleccionada.')
  }

  protected startDrag(event: PointerEvent): void {
    if (this.loading() || this.processing()) return
    this.dragPointerId = event.pointerId
    this.lastPointer = {x: event.clientX, y: event.clientY}
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  protected moveDrag(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId || !this.lastPointer) return
    const movement = {x: event.clientX - this.lastPointer.x, y: event.clientY - this.lastPointer.y}
    this.lastPointer = {x: event.clientX, y: event.clientY}
    this.moveBy(movement.x, movement.y)
  }

  protected stopDrag(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return
    this.dragPointerId = null
    this.lastPointer = null
  }

  protected changeZoom(event: Event): void {
    this.zoom.set(Number((event.target as HTMLInputElement).value))
    this.offset.set(this.clampOffset(this.offset()))
  }

  protected handleKeyboard(event: KeyboardEvent): void {
    const distance = event.shiftKey ? 12 : 4
    const movements: Partial<Record<string, Point>> = {
      ArrowLeft: {x: -distance, y: 0},
      ArrowRight: {x: distance, y: 0},
      ArrowUp: {x: 0, y: -distance},
      ArrowDown: {x: 0, y: distance},
    }
    const movement = movements[event.key]
    if (!movement) return
    event.preventDefault()
    this.moveBy(movement.x, movement.y)
  }

  protected reset(): void {
    this.zoom.set(1)
    this.offset.set({x: 0, y: 0})
  }

  protected async confirm(): Promise<void> {
    if (this.loading() || this.processing() || this.error()) return
    this.processing.set(true)
    this.error.set(null)
    try {
      const result = await this.createCrop()
      this.confirmed.emit(result)
    } catch {
      this.error.set('No se ha podido generar la imagen recortada.')
    } finally {
      this.processing.set(false)
    }
  }

  private setSource(source: Blob | string): void {
    this.revokeOwnedSourceUrl()
    this.loading.set(true)
    this.error.set(null)
    this.imageSize.set({width: 0, height: 0})
    this.reset()
    if (typeof source === 'string') {
      this.sourceUrl.set(source)
      return
    }
    this.ownedSourceUrl = URL.createObjectURL(source)
    this.sourceUrl.set(this.ownedSourceUrl)
  }

  private revokeOwnedSourceUrl(): void {
    if (!this.ownedSourceUrl) return
    URL.revokeObjectURL(this.ownedSourceUrl)
    this.ownedSourceUrl = null
  }

  private updateViewportSize(): void {
    const rect = this.viewport?.nativeElement.getBoundingClientRect()
    if (!rect?.width || !rect.height) return
    this.viewportSize.set({width: rect.width, height: rect.height})
  }

  private moveBy(x: number, y: number): void {
    this.offset.update(offset => this.clampOffset({x: offset.x + x, y: offset.y + y}))
  }

  private clampOffset(offset: Point): Point {
    const displayed = this.displayedImageSize()
    const viewport = this.viewportSize()
    const maxX = Math.max(0, (displayed.width - viewport.width) / 2)
    const maxY = Math.max(0, (displayed.height - viewport.height) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, offset.x)),
      y: Math.min(maxY, Math.max(-maxY, offset.y)),
    }
  }

  private async createCrop(): Promise<ImageCropResult> {
    this.updateViewportSize()
    const imageElement = new Image()
    imageElement.crossOrigin = 'anonymous'
    imageElement.src = this.sourceUrl()
    await imageElement.decode()

    const image = this.imageSize()
    const viewport = this.viewportSize()
    const displayed = this.displayedImageSize()
    if (!image.width || !viewport.width || !displayed.width) throw new Error('Image not ready')

    const renderedScale = displayed.width / image.width
    const cropWidth = viewport.width / renderedScale
    const cropHeight = viewport.height / renderedScale
    const offset = this.offset()
    const sourceX = image.width / 2 - offset.x / renderedScale - cropWidth / 2
    const sourceY = image.height / 2 - offset.y / renderedScale - cropHeight / 2
    const output = this.outputSize()
    const canvas = document.createElement('canvas')
    canvas.width = output.width
    canvas.height = output.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')
    context.drawImage(imageElement, sourceX, sourceY, cropWidth, cropHeight, 0, 0, output.width, output.height)
    const config = this.resolvedConfig()
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      result => result ? resolve(result) : reject(new Error('Image encoding failed')),
      config.outputMimeType,
      config.outputQuality,
    ))
    return {blob, width: output.width, height: output.height, mimeType: blob.type || config.outputMimeType}
  }

  private outputSize(): Size {
    const config = this.resolvedConfig()
    let width = config.maxOutputWidth
    let height = Math.round(width / config.aspectRatio)
    if (height > config.maxOutputHeight) {
      height = config.maxOutputHeight
      width = Math.round(height * config.aspectRatio)
    }
    return {width: Math.max(1, width), height: Math.max(1, height)}
  }

  private positive(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
  }
}
