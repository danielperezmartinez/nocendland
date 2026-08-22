import {TrainingExerciseHistoryEntry} from '../../models/training.models'
import {availableExerciseMetrics, buildExerciseProgress, calculateExerciseSessionMetrics, filterExerciseHistory} from './exercise-progress'

describe('exercise progress', () => {
  it('calculates strength metrics without inventing missing values', () => {
    const entry = createEntry('2026-08-12', [[6, 90], [8, 80], [null, 100], [10, null]])
    const metrics = calculateExerciseSessionMetrics(entry)

    expect(metrics.estimatedOneRepMax).toBe(108)
    expect(metrics.volume).toBe(1180)
    expect(metrics.maximumWeight).toBe(90)
    expect(metrics.repetitions).toBe(24)
  })

  it('excludes sets above twelve repetitions from the estimated one rep max', () => {
    const entry = createEntry('2026-08-12', [[15, 80]])
    expect(calculateExerciseSessionMetrics(entry).estimatedOneRepMax).toBeNull()
    expect(calculateExerciseSessionMetrics(entry).volume).toBe(1200)
  })

  it('falls back to repetitions when no weighted metrics exist', () => {
    const entries = [createEntry('2026-08-12', [[12, null], [10, null]])]
    expect(availableExerciseMetrics(entries)).toEqual(['repetitions'])
    expect(buildExerciseProgress(entries, 'repetitions')[0].value).toBe(22)
  })

  it('filters the inclusive twelve week period and preserves all history', () => {
    const entries = [
      createEntry('2026-05-19', [[8, 60]]),
      createEntry('2026-05-20', [[8, 62.5]]),
      createEntry('2026-08-12', [[8, 70]]),
    ]
    const today = new Date(2026, 7, 12)
    expect(filterExerciseHistory(entries, '12w', today).map(entry => entry.performed_on))
      .toEqual(['2026-05-20', '2026-08-12'])
    expect(filterExerciseHistory(entries, 'all', today).length).toBe(3)
  })
})

function createEntry(date: string, sets: ReadonlyArray<readonly [number | null, number | null]>): TrainingExerciseHistoryEntry {
  return {
    id: Number(date.replaceAll('-', '')),
    id_user: 'test-user',
    exercise_id: 1,
    performed_on: date,
    sort_order: 0,
    created_at: `${date}T00:00:00Z`,
    updated_at: `${date}T00:00:00Z`,
    training_set: sets.map(([repetitions, weight], index) => ({
      id: index + 1,
      id_user: 'test-user',
      entry_id: 1,
      position: index + 1,
      repetitions,
      weight_kg: weight,
      created_at: `${date}T00:00:00Z`,
      updated_at: `${date}T00:00:00Z`,
    })),
  }
}
