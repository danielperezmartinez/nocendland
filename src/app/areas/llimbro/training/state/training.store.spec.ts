import {TestBed} from '@angular/core/testing'
import {signal} from '@angular/core'
import {ExerciseRepository} from '../data-access/exercise.repository'
import {ScheduleRepository} from '../data-access/schedule.repository'
import {ShareRepository} from '../data-access/share.repository'
import {TrackingRepository} from '../data-access/tracking.repository'
import {TrainingExerciseHistoryEntry} from '../models/training.models'
import {TrainingStore} from './training.store'
import type {Mock} from 'vitest'

describe('TrainingStore previous sessions', () => {
  let store: TrainingStore
  let tracking: {
    readByDate: Mock<TrackingRepository['readByDate']>
    readRecentBeforeByExercise: Mock<TrackingRepository['readRecentBeforeByExercise']>
  }

  beforeEach(() => {
    const exercises = {
      readActive: vi.fn().mockResolvedValue([]),
      saving: signal(false),
      savingImage: signal(false),
    }
    const schedules = {
      ensureDefault: vi.fn().mockResolvedValue(undefined),
      readCatalog: vi.fn().mockResolvedValue([]),
      readAll: vi.fn().mockResolvedValue([]),
    }
    const shares = {list: vi.fn().mockResolvedValue([])}
    tracking = {
      readByDate: vi.fn<TrackingRepository['readByDate']>().mockResolvedValue([]),
      readRecentBeforeByExercise: vi.fn<TrackingRepository['readRecentBeforeByExercise']>(),
    }

    TestBed.configureTestingModule({
      providers: [
        TrainingStore,
        {provide: ExerciseRepository, useValue: exercises satisfies Partial<ExerciseRepository>},
        {provide: ScheduleRepository, useValue: schedules satisfies Partial<ScheduleRepository>},
        {provide: ShareRepository, useValue: shares satisfies Partial<ShareRepository>},
        {provide: TrackingRepository, useValue: tracking satisfies Partial<TrackingRepository>},
      ],
    })
    store = TestBed.inject(TrainingStore)
  })

  it('reuses a request and caches an empty result for the active date', async () => {
    const date = new Date(2026, 7, 5)
    store.selectDate(date)
    tracking.readRecentBeforeByExercise.mockResolvedValue([])

    await Promise.all([store.loadPreviousSessions([3], date), store.loadPreviousSessions([3], date)])
    await store.loadPreviousSessions([3], date)

    expect(tracking.readRecentBeforeByExercise).toHaveBeenCalledExactlyOnceWith(3, '2026-8-5')
    expect(store.recentSessions().get(3)).toEqual([])
    expect(store.previousSessions().get(3)).toBeNull()
  })

  it('discards a response when the selected date changes', async () => {
    const firstDate = new Date(2026, 7, 5)
    const secondDate = new Date(2026, 7, 6)
    let resolvePrevious!: (entry: TrainingExerciseHistoryEntry | null) => void
    tracking.readRecentBeforeByExercise.mockReturnValue(new Promise(resolve => resolvePrevious = entry => resolve(entry ? [entry] : [])))
    store.selectDate(firstDate)
    const pending = store.loadPreviousSessions([3], firstDate)

    store.selectDate(secondDate)
    resolvePrevious(previousEntry())
    await pending

    expect(store.recentSessions().has(3)).toBe(false)
  })

  it('keeps reminder failures isolated from tracking state', async () => {
    const date = new Date(2026, 7, 5)
    store.selectDate(date)
    tracking.readRecentBeforeByExercise.mockRejectedValue(new Error('network'))

    await expect(store.loadPreviousSessions([3], date)).resolves.toBeUndefined()
    expect(store.recentSessions().has(3)).toBe(false)
  })

  it('derives the previous-session reminder from the latest recent session', async () => {
    const latest = previousEntry()
    const older = {...previousEntry(), id: 19, performed_on: '2026-07-22'}
    tracking.readRecentBeforeByExercise.mockResolvedValue([latest, older])
    const date = new Date(2026, 7, 5)
    store.selectDate(date)

    await store.loadPreviousSessions([3], date)

    expect(store.previousSessions().get(3)).toBe(latest)
  })
})

function previousEntry(): TrainingExerciseHistoryEntry {
  return {
    id: 20,
    id_user: 'test-user',
    exercise_id: 3,
    performed_on: '2026-07-29',
    sort_order: 0,
    created_at: '2026-07-29T00:00:00Z',
    updated_at: '2026-07-29T00:00:00Z',
    training_set: [],
  }
}
