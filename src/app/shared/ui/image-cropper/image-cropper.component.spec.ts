import {ComponentFixture, TestBed} from '@angular/core/testing'
import {ImageCropResult} from './image-cropper.models'
import {ImageCropperComponent} from './image-cropper.component'

const TEST_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="red"/></svg>',
)

describe('ImageCropperComponent', () => {
  let fixture: ComponentFixture<ImageCropperComponent>
  let component: ImageCropperComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [ImageCropperComponent]}).compileComponents()
    fixture = TestBed.createComponent(ImageCropperComponent)
    component = fixture.componentInstance
  })

  it('loads a source and emits a crop with the configured aspect ratio', async () => {
    fixture.componentRef.setInput('source', TEST_IMAGE)
    fixture.componentRef.setInput('config', {
      aspectRatio: 2,
      maxOutputWidth: 800,
      maxOutputHeight: 300,
      outputMimeType: 'image/png',
    })
    fixture.detectChanges()
    const viewport = fixture.nativeElement.querySelector('.image-cropper__viewport') as HTMLElement
    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 200,
      top: 0,
      left: 0,
      right: 400,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement
    Object.defineProperties(image, {
      naturalWidth: {configurable: true, value: 800},
      naturalHeight: {configurable: true, value: 400},
    })
    image.dispatchEvent(new Event('load'))
    fixture.detectChanges()

    const result = new Promise<ImageCropResult>(resolve => component.confirmed.subscribe(resolve))
    ;(fixture.nativeElement.querySelector('.image-cropper__actions .ui-button:last-child') as HTMLButtonElement).click()
    const crop = await result

    expect(crop.width).toBe(600)
    expect(crop.height).toBe(300)
    expect(crop.mimeType).toBe('image/png')
    expect(crop.blob.size).toBeGreaterThan(0)
  })

  it('supports keyboard positioning, zoom reset and cancellation', async () => {
    fixture.componentRef.setInput('source', TEST_IMAGE)
    fixture.detectChanges()
    const viewport = fixture.nativeElement.querySelector('.image-cropper__viewport') as HTMLElement
    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
      width: 300,
      height: 300,
      top: 0,
      left: 0,
      right: 300,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement
    Object.defineProperties(image, {
      naturalWidth: {configurable: true, value: 800},
      naturalHeight: {configurable: true, value: 400},
    })
    image.dispatchEvent(new Event('load'))
    fixture.detectChanges()

    const zoom = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement
    zoom.value = '2'
    zoom.dispatchEvent(new Event('input'))
    viewport.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'}))
    fixture.detectChanges()
    expect((image.style.transform)).toContain('4px')

    ;(fixture.nativeElement.querySelector('.image-cropper__controls button') as HTMLButtonElement).click()
    fixture.detectChanges()
    expect(zoom.value).toBe('1')

    let cancelled = false
    component.cancelled.subscribe(() => cancelled = true)
    ;(fixture.nativeElement.querySelector('.image-cropper__actions .ui-button') as HTMLButtonElement).click()
    expect(cancelled).toBe(true)
  })

  it('reports an unreadable source', () => {
    fixture.componentRef.setInput('source', 'data:image/png;base64,invalid')
    fixture.detectChanges()
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement
    image.dispatchEvent(new Event('error'))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('No se ha podido leer')
  })
})
