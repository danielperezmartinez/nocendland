import {TrainingExerciseHistoryEntry} from '../../models/training.models'
import {analyzeLoadProgression, LoadProgressionTarget} from './load-progression-analysis'

describe('analyzeLoadProgression', () => {
  const target: LoadProgressionTarget = {setCount: 3, targetRepetitions: 10, targetWeightKg: 40}

  it('recommends progression after two completed sessions with equal or increasing working weight', () => {
    const sameWeight = analyzeLoadProgression(target, [session('2026-08-11', [40, 40, 40]), session('2026-08-04', [40, 40, 40])])
    const increasedWeight = analyzeLoadProgression(target, [session('2026-08-11', [42.5, 42.5, 42.5]), session('2026-08-04', [40, 40, 40])])

    expect(sameWeight).toEqual(expect.objectContaining({previousWorkingWeightKg: 40, latestWorkingWeightKg: 40}))
    expect(increasedWeight).toEqual(expect.objectContaining({previousWorkingWeightKg: 40, latestWorkingWeightKg: 42.5}))
  })

  it('ignores sets beyond the configured target', () => {
    const result = analyzeLoadProgression(target, [
      session('2026-08-11', [40, 40, 40, null]),
      session('2026-08-04', [40, 40, 40, null]),
    ])

    expect(result).not.toBeNull()
  })

  it('does not recommend with fewer than two sessions or an incomplete target', () => {
    expect(analyzeLoadProgression(target, [session('2026-08-11', [40, 40, 40])])).toBeNull()
    expect(analyzeLoadProgression({...target, targetWeightKg: null}, [
      session('2026-08-11', [40, 40, 40]),
      session('2026-08-04', [40, 40, 40]),
    ])).toBeNull()
  })

  it('does not recommend when a planned set is missing or incomplete', () => {
    expect(analyzeLoadProgression(target, [
      session('2026-08-11', [40, 40]),
      session('2026-08-04', [40, 40, 40]),
    ])).toBeNull()
    expect(analyzeLoadProgression(target, [
      session('2026-08-11', [40, 40, null]),
      session('2026-08-04', [40, 40, 40]),
    ])).toBeNull()
  })

  it('does not recommend below the repetitions or weight target', () => {
    expect(analyzeLoadProgression(target, [
      session('2026-08-11', [40, 40, 40], [10, 9, 10]),
      session('2026-08-04', [40, 40, 40]),
    ])).toBeNull()
    expect(analyzeLoadProgression(target, [
      session('2026-08-11', [40, 39.75, 40]),
      session('2026-08-04', [40, 40, 40]),
    ])).toBeNull()
  })

  it('does not recommend when the latest working weight is lower', () => {
    expect(analyzeLoadProgression(target, [
      session('2026-08-11', [40, 40, 40]),
      session('2026-08-04', [42.5, 42.5, 42.5]),
    ])).toBeNull()
  })
})

function session(
  date: string,
  weights: readonly (number | null)[],
  repetitions = weights.map(() => 10),
): TrainingExerciseHistoryEntry {
  return {
    id: Number(date.replaceAll('-', '')),
    id_user: 'test-user',
    exercise_id: 3,
    performed_on: date,
    sort_order: 0,
    created_at: `${date}T00:00:00Z`,
    updated_at: `${date}T00:00:00Z`,
    training_set: weights.map((weight, index) => ({
      id: index + 1,
      id_user: 'test-user',
      entry_id: Number(date.replaceAll('-', '')),
      position: index + 1,
      repetitions: repetitions[index] ?? null,
      weight_kg: weight,
      created_at: `${date}T00:00:00Z`,
      updated_at: `${date}T00:00:00Z`,
    })),
  }
}
