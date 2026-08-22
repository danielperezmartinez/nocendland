import {TrainingExerciseHistoryEntry} from '../../models/training.models'

export type ExerciseProgressMetric = 'estimatedOneRepMax' | 'volume' | 'maximumWeight' | 'repetitions'
export type ExerciseProgressRange = '4w' | '12w' | '6m' | '1y' | 'all'

export interface ExerciseProgressPoint {
  entry: TrainingExerciseHistoryEntry
  value: number
}

export interface ExerciseSessionMetrics {
  estimatedOneRepMax: number | null
  volume: number | null
  maximumWeight: number | null
  repetitions: number | null
}

export function calculateExerciseSessionMetrics(entry: TrainingExerciseHistoryEntry): ExerciseSessionMetrics {
  const weightedSets = entry.training_set.filter(set =>
    set.weight_kg !== null && set.weight_kg > 0 && set.repetitions !== null && set.repetitions > 0)
  const oneRepMaxValues = weightedSets
    .filter(set => set.repetitions! <= 12)
    .map(set => set.weight_kg! * (1 + set.repetitions! / 30))
  const repetitionValues = entry.training_set
    .map(set => set.repetitions)
    .filter((value): value is number => value !== null && value > 0)

  return {
    estimatedOneRepMax: maximumOrNull(oneRepMaxValues),
    volume: sumOrNull(weightedSets.map(set => set.weight_kg! * set.repetitions!)),
    maximumWeight: maximumOrNull(weightedSets.map(set => set.weight_kg!)),
    repetitions: sumOrNull(repetitionValues),
  }
}

export function buildExerciseProgress(
  entries: readonly TrainingExerciseHistoryEntry[],
  metric: ExerciseProgressMetric,
): ExerciseProgressPoint[] {
  return entries.flatMap(entry => {
    const value = calculateExerciseSessionMetrics(entry)[metric]
    return value === null ? [] : [{entry, value: roundMetric(value)}]
  })
}

export function filterExerciseHistory(
  entries: readonly TrainingExerciseHistoryEntry[],
  range: ExerciseProgressRange,
  today = new Date(),
): TrainingExerciseHistoryEntry[] {
  if (range === 'all') return [...entries]
  const start = startOfRange(range, today)
  const startKey = formatDateKey(start)
  const endKey = formatDateKey(today)
  return entries.filter(entry => entry.performed_on >= startKey && entry.performed_on <= endKey)
}

export function availableExerciseMetrics(entries: readonly TrainingExerciseHistoryEntry[]): ExerciseProgressMetric[] {
  const metrics: ExerciseProgressMetric[] = ['estimatedOneRepMax', 'volume', 'maximumWeight', 'repetitions']
  return metrics.filter(metric => buildExerciseProgress(entries, metric).length > 0)
}

function startOfRange(range: Exclude<ExerciseProgressRange, 'all'>, today: Date): Date {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (range === '4w') start.setDate(start.getDate() - 28)
  if (range === '12w') start.setDate(start.getDate() - 84)
  if (range === '6m') start.setMonth(start.getMonth() - 6)
  if (range === '1y') start.setFullYear(start.getFullYear() - 1)
  return start
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function maximumOrNull(values: readonly number[]): number | null {
  return values.length ? Math.max(...values) : null
}

function sumOrNull(values: readonly number[]): number | null {
  return values.length ? values.reduce((total, value) => total + value, 0) : null
}

function roundMetric(value: number): number {
  return Math.round(value * 10) / 10
}
