import {TrainingExerciseHistoryEntry} from '../../models/training.models'

export interface LoadProgressionTarget {
  setCount: number
  targetRepetitions: number | null
  targetWeightKg: number | null
}

export interface LoadProgressionRecommendation {
  setCount: number
  targetRepetitions: number
  targetWeightKg: number
  previousWorkingWeightKg: number
  latestWorkingWeightKg: number
}

export function analyzeLoadProgression(
  target: LoadProgressionTarget | null,
  recentSessions: readonly TrainingExerciseHistoryEntry[],
): LoadProgressionRecommendation | null {
  if (!hasCompleteTarget(target) || recentSessions.length < 2) return null

  const latestWorkingWeightKg = completedWorkingWeight(recentSessions[0], target)
  const previousWorkingWeightKg = completedWorkingWeight(recentSessions[1], target)
  if (latestWorkingWeightKg === null || previousWorkingWeightKg === null) return null
  if (latestWorkingWeightKg < previousWorkingWeightKg) return null

  return {
    setCount: target.setCount,
    targetRepetitions: target.targetRepetitions,
    targetWeightKg: target.targetWeightKg,
    previousWorkingWeightKg,
    latestWorkingWeightKg,
  }
}

function hasCompleteTarget(target: LoadProgressionTarget | null): target is {
  setCount: number
  targetRepetitions: number
  targetWeightKg: number
} {
  return target !== null
    && Number.isInteger(target.setCount)
    && target.setCount > 0
    && target.targetRepetitions !== null
    && target.targetRepetitions > 0
    && target.targetWeightKg !== null
    && target.targetWeightKg > 0
}

function completedWorkingWeight(
  session: TrainingExerciseHistoryEntry,
  target: {setCount: number; targetRepetitions: number; targetWeightKg: number},
): number | null {
  const plannedSets = [...session.training_set]
    .sort((left, right) => left.position - right.position)
    .slice(0, target.setCount)
  if (plannedSets.length < target.setCount) return null

  const weights = plannedSets.flatMap(set =>
    set.repetitions !== null
      && set.repetitions >= target.targetRepetitions
      && set.weight_kg !== null
      && set.weight_kg >= target.targetWeightKg
      ? [set.weight_kg]
      : [],
  )
  return weights.length === target.setCount ? Math.min(...weights) : null
}
