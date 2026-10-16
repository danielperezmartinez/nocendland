import {compressImage} from './image-compression.utils'

describe('compressImage', () => {
  let toBlobSizes: number[]
  let drawImage: ReturnType<typeof vi.fn>
  let qualities: number[]

  beforeEach(() => {
    toBlobSizes = []
    qualities = []
    drawImage = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({width: 4000, height: 2000, close: vi.fn()}))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({drawImage} as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type, quality) {
      qualities.push(quality as number)
      const size = toBlobSizes.shift() ?? 1
      callback(new Blob([new Uint8Array(size)], {type: type as string}))
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('scales the longest side down and encodes WebP within the size limit', async () => {
    toBlobSizes = [500]
    const result = await compressImage(new File([new Uint8Array(5000)], 'foto.jpg', {type: 'image/jpeg'}), {
      maxBytes: 1000,
      maxDimension: 1024,
    })

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 512)
    expect(result.type).toBe('image/webp')
    expect(result.name).toBe('foto.webp')
    expect(result.size).toBe(500)
  })

  it('lowers the quality until the image fits', async () => {
    toBlobSizes = [3000, 2000, 900]
    const result = await compressImage(new File([new Uint8Array(5000)], 'foto.png', {type: 'image/png'}), {
      maxBytes: 1000,
      maxDimension: 1024,
    })

    expect(qualities).toEqual([0.86, 0.76, 0.66])
    expect(result.size).toBe(900)
  })

  it('rejects when no quality fits the limit', async () => {
    toBlobSizes = [3000, 3000, 3000, 3000]
    await expect(compressImage(new File([new Uint8Array(5000)], 'foto.png', {type: 'image/png'}), {
      maxBytes: 1000,
      maxDimension: 1024,
    })).rejects.toThrow('image_compression_too_large')
  })

  it('returns the original file when it already fits', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({width: 800, height: 600, close: vi.fn()}))
    const original = new File([new Uint8Array(500)], 'foto.jpg', {type: 'image/jpeg'})

    expect(await compressImage(original, {maxBytes: 1000, maxDimension: 1024})).toBe(original)
  })

  it('rejects files that are not images', async () => {
    await expect(compressImage(new File(['texto'], 'nota.txt', {type: 'text/plain'}), {
      maxBytes: 1000,
      maxDimension: 1024,
    })).rejects.toThrow('image_compression_invalid_type')
  })
})
