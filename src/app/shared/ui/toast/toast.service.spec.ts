import {TestBed} from '@angular/core/testing'
import {ToastService} from './toast.service'

describe('ToastService', () => {
  let service: ToastService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(ToastService)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-14T12:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('publishes and automatically dismisses a success message', () => {
    service.success('Horario guardado', {description: 'Tus cambios ya están al día.', durationMs: 1000})

    expect(service.messages().length).toBe(1)
    expect(service.messages()[0]).toEqual(expect.objectContaining({
      kind: 'success',
      title: 'Horario guardado',
      description: 'Tus cambios ya están al día.',
    }))

    vi.advanceTimersByTime(1000)
    expect(service.messages()).toEqual([])
  })

  it('keeps at most three messages and discards the oldest', () => {
    service.success('Primero')
    service.success('Segundo')
    service.error('Tercero')
    service.success('Cuarto')

    expect(service.messages().map(message => message.title)).toEqual(['Segundo', 'Tercero', 'Cuarto'])
  })

  it('pauses and resumes automatic dismissal', () => {
    const id = service.error('Sin conexión', {durationMs: 1000})
    vi.advanceTimersByTime(400)

    service.pause(id)
    vi.advanceTimersByTime(2000)
    expect(service.messages().length).toBe(1)

    service.resume(id)
    vi.advanceTimersByTime(599)
    expect(service.messages().length).toBe(1)
    vi.advanceTimersByTime(1)
    expect(service.messages()).toEqual([])
  })
})
