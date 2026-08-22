import {Injectable, signal} from '@angular/core'
import {AuthService} from '@platform/auth/auth.service'
import {LOGGER_COLORS, LoggerService} from '@platform/logging/logger.service'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {SupabaseStorageService} from '@platform/supabase/supabase-storage.service'
import {TrainingExercise, TrainingExerciseDraft, TrainingExerciseInsert} from '../models/training.models'

@Injectable()
export class ExerciseRepository {
  private readonly entity = 'training_exercise'
  private readonly savingState = signal(false)
  private readonly savingImageState = signal(false)

  readonly saving = this.savingState.asReadonly()
  readonly savingImage = this.savingImageState.asReadonly()

  constructor(
    private readonly supabase: SupabaseClientService,
    private readonly auth: AuthService,
    private readonly logger: LoggerService,
    private readonly storage: SupabaseStorageService,
  ) {
    this.logger.setConfig(ExerciseRepository.name, LOGGER_COLORS.API)
  }

  async readActive(): Promise<TrainingExercise[]> {
    const userId = this.auth.requireUserId()
    const query = await this.supabase.client.from(this.entity).select('*')
      .eq('id_user', userId).is('archived_at', null).order('name')
    if (query.error) return Promise.reject(query.error)
    return query.data
  }

  async readById(id: number): Promise<TrainingExercise> {
    const query = await this.supabase.client.from(this.entity).select('*')
      .eq('id_user', this.auth.requireUserId()).eq('id', id).single()
    if (query.error) return Promise.reject(query.error)
    return query.data
  }

  async save(draft: TrainingExerciseDraft): Promise<TrainingExercise> {
    this.savingState.set(true)
    try {
      const now = new Date().toISOString()
      const values: TrainingExerciseInsert = {
        id: draft.id,
        id_user: this.auth.requireUserId(),
        name: draft.name.trim(),
        description: draft.description?.trim() || null,
        tips: draft.tips.map(tip => tip.trim()).filter(Boolean),
        image_path: draft.image_path,
        video_url: draft.video_url?.trim() || null,
        training_modalities: draft.training_modalities,
        muscle_groups: draft.muscle_groups,
        movement_patterns: draft.movement_patterns,
        updated_at: now,
      }
      const query = draft.id
        ? await this.supabase.client.from(this.entity).update(values).eq('id', draft.id).select().single()
        : await this.supabase.client.from(this.entity).insert(values).select().single()
      if (query.error) return Promise.reject(query.error)
      return query.data
    } finally {
      this.savingState.set(false)
    }
  }

  async archive(exerciseId: number): Promise<void> {
    const userId = this.auth.requireUserId()
    const scheduleDelete = await this.supabase.client.from('training_schedule_item').delete()
      .eq('id_user', userId).eq('exercise_id', exerciseId)
    if (scheduleDelete.error) return Promise.reject(scheduleDelete.error)

    const query = await this.supabase.client.from(this.entity).update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id_user', userId).eq('id', exerciseId)
    if (query.error) return Promise.reject(query.error)
  }

  async readImage(exerciseId: number): Promise<Blob | null> {
    const path = this.imagePath(exerciseId)
    const query = await this.storage.readImage(path)
    if (query.error) return null
    return query.data
  }

  async uploadImage(exerciseId: number, file: File): Promise<string> {
    this.savingImageState.set(true)
    try {
      const path = this.imagePath(exerciseId)
      const query = await this.storage.uploadImage(path, file)
      if (query.error) return Promise.reject(query.error)
      const update = await this.supabase.client.from(this.entity).update({
        image_path: path,
        updated_at: new Date().toISOString(),
      }).eq('id_user', this.auth.requireUserId()).eq('id', exerciseId)
      if (update.error) return Promise.reject(update.error)
      return path
    } finally {
      this.savingImageState.set(false)
    }
  }

  async removeImage(exerciseId: number): Promise<void> {
    this.savingImageState.set(true)
    try {
      const path = this.imagePath(exerciseId)
      const removed = await this.storage.removeFiles([path])
      if (removed.error) return Promise.reject(removed.error)
      const update = await this.supabase.client.from(this.entity).update({
        image_path: null,
        updated_at: new Date().toISOString(),
      }).eq('id_user', this.auth.requireUserId()).eq('id', exerciseId)
      if (update.error) return Promise.reject(update.error)
    } finally {
      this.savingImageState.set(false)
    }
  }

  private imagePath(exerciseId: number): string {
    return `${this.entity}/${this.auth.requireUserId()}/${exerciseId}`
  }
}
