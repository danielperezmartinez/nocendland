import {TestBed} from '@angular/core/testing'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {describeTrainingShareError, TrainingShareError} from '../models/share-errors'
import {ShareRepository} from './share.repository'

describe('ShareRepository', () => {
  let invoke: ReturnType<typeof vi.fn>
  let repository: ShareRepository

  beforeEach(() => {
    invoke = vi.fn()
    TestBed.configureTestingModule({
      providers: [
        ShareRepository,
        {provide: SupabaseClientService, useValue: {client: {functions: {invoke}}}},
      ],
    })
    repository = TestBed.inject(ShareRepository)
  })

  it('rejects with the public error code returned by the function', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: {message: 'Edge Function returned a non-2xx status code', context: Response.json({code: 'share_limit_reached'}, {status: 409})},
    })

    const error = await repository.create('exercises', [1]).catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(TrainingShareError)
    expect((error as TrainingShareError).code).toBe('share_limit_reached')
    expect(describeTrainingShareError(error, 'genérico')).toBe('Ya tienes 20 enlaces activos. Revoca alguno para crear otro.')
  })

  it('falls back to the generic code when the response has no body', async () => {
    invoke.mockResolvedValue({data: null, error: {message: 'Failed to send a request'}})

    const error = await repository.preview('token').catch((reason: unknown) => reason)

    expect((error as TrainingShareError).code).toBe('training_share_failed')
    expect(describeTrainingShareError(error, 'genérico')).toBe('genérico')
  })

  it('shows the rate limit message for previews', async () => {
    invoke.mockResolvedValue({data: null, error: {message: 'x', context: Response.json({code: 'rate_limited'}, {status: 429})}})

    const error = await repository.preview('token').catch((reason: unknown) => reason)

    expect(describeTrainingShareError(error, 'genérico')).toContain('demasiadas visitas')
  })
})
