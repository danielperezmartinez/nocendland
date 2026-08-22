import {AuthService} from '@platform/auth/auth.service'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {TrackingRepository} from './tracking.repository'

describe('TrackingRepository', () => {
  it('reads the two latest sessions before the selected date and sorts their sets', async () => {
    const latest = {
      id: 20,
      id_user: 'test-user',
      exercise_id: 3,
      performed_on: '2026-07-29',
      sort_order: 0,
      created_at: '2026-07-29T00:00:00Z',
      updated_at: '2026-07-29T00:00:00Z',
      training_set: [
        {id: 32, id_user: 'test-user', entry_id: 20, position: 2, repetitions: 8, weight_kg: 42.5, created_at: '', updated_at: ''},
        {id: 31, id_user: 'test-user', entry_id: 20, position: 1, repetitions: 10, weight_kg: 40, created_at: '', updated_at: ''},
      ],
    }
    const previous = {
      ...latest,
      id: 19,
      performed_on: '2026-07-22',
      training_set: latest.training_set.map(set => ({...set, id: set.id - 2, entry_id: 19})),
    }
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      lt: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      then: (resolve: (value: {data: typeof latest[]; error: null}) => unknown) =>
        Promise.resolve(resolve({data: [latest, previous], error: null})),
    }
    builder.select.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.lt.mockReturnValue(builder)
    builder.order.mockReturnValue(builder)
    builder.limit.mockReturnValue(builder)
    const supabase = {client: {from: vi.fn().mockReturnValue(builder)}}
    const auth = {requireUserId: vi.fn().mockReturnValue('test-user')}
    const repository = new TrackingRepository(
      supabase as unknown as SupabaseClientService,
      auth as unknown as AuthService,
    )

    const result = await repository.readRecentBeforeByExercise(3, '2026-08-05')

    expect(builder.eq.mock.calls).toEqual([['id_user', 'test-user'], ['exercise_id', 3]])
    expect(builder.lt).toHaveBeenCalledExactlyOnceWith('performed_on', '2026-08-05')
    expect(builder.order).toHaveBeenCalledExactlyOnceWith('performed_on', {ascending: false})
    expect(builder.limit).toHaveBeenCalledExactlyOnceWith(2)
    expect(result.map(entry => entry.performed_on)).toEqual(['2026-07-29', '2026-07-22'])
    expect(result.every(entry => entry.training_set.map(set => set.position).join() === '1,2')).toBe(true)
  })
})
