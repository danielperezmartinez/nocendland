import {vi} from 'vitest'

Object.defineProperty(globalThis, 'matchMedia', {
  configurable: true,
  value: vi.fn((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
})

class TestResizeObserver implements ResizeObserver {
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: TestResizeObserver,
})

class TestTouch implements Touch {
  readonly identifier: number
  readonly target: EventTarget
  readonly clientX: number
  readonly clientY: number
  readonly force = 0
  readonly pageX: number
  readonly pageY: number
  readonly radiusX = 0
  readonly radiusY = 0
  readonly rotationAngle = 0
  readonly screenX: number
  readonly screenY: number

  constructor(init: TouchInit) {
    this.identifier = init.identifier
    this.target = init.target
    this.clientX = init.clientX ?? 0
    this.clientY = init.clientY ?? 0
    this.pageX = init.pageX ?? this.clientX
    this.pageY = init.pageY ?? this.clientY
    this.screenX = init.screenX ?? this.clientX
    this.screenY = init.screenY ?? this.clientY
  }
}

Object.defineProperty(globalThis, 'Touch', {
  configurable: true,
  value: TestTouch,
})

Object.defineProperty(HTMLImageElement.prototype, 'decode', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => ({drawImage: vi.fn()})),
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  configurable: true,
  value: vi.fn((callback: BlobCallback, type?: string) => callback(new Blob(['crop'], {type}))),
})
