import {Database} from '@platform/supabase/database.types'
import {TrainingModality, TrainingMovementPattern, TrainingMuscleGroup} from '../training.constants'

export type TrainingExercise = Database['public']['Tables']['training_exercise']['Row']
export type TrainingExerciseInsert = Database['public']['Tables']['training_exercise']['Insert']
export type TrainingSchedule = Database['public']['Tables']['training_schedule']['Row']
export type TrainingScheduleInsert = Database['public']['Tables']['training_schedule']['Insert']
export type TrainingScheduleItem = Database['public']['Tables']['training_schedule_item']['Row']
export type TrainingScheduleItemInsert = Database['public']['Tables']['training_schedule_item']['Insert']
export type TrainingShare = Database['public']['Tables']['training_share']['Row']
export type TrainingEntry = Database['public']['Tables']['training_entry']['Row']
export type TrainingEntryInsert = Database['public']['Tables']['training_entry']['Insert']
export type TrainingSet = Database['public']['Tables']['training_set']['Row']
export type TrainingSetInsert = Database['public']['Tables']['training_set']['Insert']

export type TrainingExerciseListItem = TrainingExercise & {imageUrl?: string}
export type TrainingScheduleItemWithExercise = TrainingScheduleItem & {training_exercise: TrainingExercise}
export type TrainingEntryWithDetails = TrainingEntry & {
  training_exercise: TrainingExercise
  training_set: TrainingSet[]
}
export type TrainingExerciseHistoryEntry = TrainingEntry & {training_set: TrainingSet[]}

export interface TrainingExerciseDraft {
  id?: number
  name: string
  description: string | null
  tips: string[]
  image_path: string | null
  video_url: string | null
  training_modalities: TrainingModality[]
  muscle_groups: TrainingMuscleGroup[]
  movement_patterns: TrainingMovementPattern[]
}

export interface TrainingScheduleDraft {
  id?: number
  exerciseId: number
  setCount: number
  targetRepetitions: number | null
  targetWeightKg: number | null
  sortOrder: number
}

export interface TrainingScheduleCatalogDraftItem {
  key: string
  id: number | null
  name: string
  isActive: boolean
  duplicateFromId: number | null
  updatedAt: string | null
  deleted: boolean
}

export interface TrainingScheduleCatalogSaveResult {
  scheduleIds: Record<string, number>
  selectedScheduleId: number
}

export type TrainingShareType = 'exercises' | 'schedule'
export type TrainingShareConflictAction = 'keep' | 'update'

export interface TrainingShareExercise {
  portableId: string
  name: string
  description: string | null
  tips: string[]
  imageKey: string | null
  imageUrl?: string
  videoUrl?: string | null
  trainingModalities?: TrainingModality[]
  muscleGroups?: TrainingMuscleGroup[]
  movementPatterns?: TrainingMovementPattern[]
}

export interface TrainingShareScheduleItem {
  exercisePortableId: string
  setCount: number
  targetRepetitions: number | null
  targetWeightKg: number | null
  sortOrder: number
}

export interface TrainingShareScheduleDay {
  weekday: number
  items: TrainingShareScheduleItem[]
}

export interface TrainingShareSchedule {
  portableId: string
  name: string
  days: TrainingShareScheduleDay[]
}

export interface TrainingShareManifest {
  version: 'training-share/v1'
  type: TrainingShareType
  title: string
  exercises: TrainingShareExercise[]
  schedule?: TrainingShareSchedule
}

export interface TrainingSharePreview {
  shareId: string
  createdAt: string
  manifest: TrainingShareManifest
}

export interface TrainingShareImportOptions {
  activateSchedule: boolean
  conflicts: Readonly<Record<string, TrainingShareConflictAction>>
}

export interface TrainingShareImportResult {
  exerciseIds: Record<string, number>
  scheduleId: number | null
  scheduleName: string | null
  imageFailures: string[]
}

export interface TrainingShareCreated {
  id: string
  token: string
}

export interface TrainingSetDraft {
  id?: number
  position: number
  repetitions: number | null
  weightKg: number | null
}

export interface TrainingEntryDraft {
  id?: number
  exerciseId: number
  sortOrder: number
  sets: TrainingSetDraft[]
}
