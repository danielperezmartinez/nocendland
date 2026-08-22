import {Injectable} from '@angular/core'
import {AuthService} from '@platform/auth/auth.service'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {Json} from '@platform/supabase/database.types'
import {
  TrainingSchedule,
  TrainingScheduleCatalogDraftItem,
  TrainingScheduleCatalogSaveResult,
  TrainingScheduleDraft,
  TrainingScheduleInsert,
  TrainingScheduleItemInsert,
  TrainingScheduleItemWithExercise,
} from '../models/training.models'

@Injectable()
export class ScheduleRepository {
  constructor(private readonly supabase: SupabaseClientService, private readonly auth: AuthService) {}

  async ensureDefault(): Promise<TrainingSchedule> {
    const query = await this.supabase.client.rpc('ensure_training_schedule')
    if (query.error) return Promise.reject(query.error)
    return query.data
  }

  async readCatalog(): Promise<TrainingSchedule[]> {
    const query = await this.supabase.client.from('training_schedule').select('*')
      .eq('id_user', this.auth.requireUserId()).order('created_at').order('id')
    if (query.error) return Promise.reject(query.error)
    return query.data
  }

  async readAll(): Promise<TrainingScheduleItemWithExercise[]> {
    const query = await this.supabase.client.from('training_schedule_item')
      .select('*, training_exercise(*)')
      .eq('id_user', this.auth.requireUserId())
      .order('schedule_id').order('weekday').order('sort_order')
    if (query.error) return Promise.reject(query.error)
    return query.data
  }

  async create(name: string): Promise<TrainingSchedule> {
    const values: TrainingScheduleInsert = {
      id_user: this.auth.requireUserId(),
      name: name.trim(),
    }
    const query = await this.supabase.client.from('training_schedule').insert(values).select().single()
    if (query.error) return Promise.reject(query.error)
    return query.data
  }

  async rename(scheduleId: number, name: string): Promise<void> {
    const query = await this.supabase.client.from('training_schedule').update({
      name: name.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id_user', this.auth.requireUserId()).eq('id', scheduleId)
    if (query.error) return Promise.reject(query.error)
  }

  async activate(scheduleId: number): Promise<void> {
    const query = await this.supabase.client.rpc('activate_training_schedule', {target_schedule_id: scheduleId})
    if (query.error) return Promise.reject(query.error)
  }

  async saveCatalog(
    drafts: readonly TrainingScheduleCatalogDraftItem[],
    selectedKey: string,
  ): Promise<TrainingScheduleCatalogSaveResult> {
    const catalogDraft: Json = drafts.map(draft => ({
      key: draft.key,
      id: draft.id,
      name: draft.name,
      isActive: draft.isActive,
      duplicateFromId: draft.duplicateFromId,
      updatedAt: draft.updatedAt,
      deleted: draft.deleted,
    }))
    const query = await this.supabase.client.rpc('save_training_schedule_catalog', {
      catalog_draft: catalogDraft,
      selected_key: selectedKey,
    })
    if (query.error) return Promise.reject(query.error)
    const result = query.data as unknown as TrainingScheduleCatalogSaveResult
    if (!result || !Number.isInteger(result.selectedScheduleId) || typeof result.scheduleIds !== 'object') {
      return Promise.reject(new Error('Invalid training schedule catalog response'))
    }
    return result
  }

  async duplicate(schedule: TrainingSchedule, items: readonly TrainingScheduleItemWithExercise[], name: string): Promise<void> {
    const created = await this.create(name)
    const userId = this.auth.requireUserId()
    const values: TrainingScheduleItemInsert[] = items.map(item => ({
      id_user: userId,
      schedule_id: created.id,
      exercise_id: item.exercise_id,
      weekday: item.weekday,
      set_count: item.set_count,
      target_repetitions: item.target_repetitions,
      target_weight_kg: item.target_weight_kg,
      sort_order: item.sort_order,
    }))
    if (!values.length) return
    const query = await this.supabase.client.from('training_schedule_item').insert(values)
    if (query.error) return Promise.reject(query.error)
  }

  async delete(scheduleId: number): Promise<void> {
    const query = await this.supabase.client.from('training_schedule').delete()
      .eq('id_user', this.auth.requireUserId()).eq('id', scheduleId)
    if (query.error) return Promise.reject(query.error)
  }

  async replaceDay(scheduleId: number, weekday: number, drafts: readonly TrainingScheduleDraft[]): Promise<void> {
    const userId = this.auth.requireUserId()
    const current = await this.supabase.client.from('training_schedule_item').select('id')
      .eq('id_user', userId).eq('schedule_id', scheduleId).eq('weekday', weekday)
    if (current.error) return Promise.reject(current.error)

    const retainedIds = new Set(drafts.flatMap(draft => draft.id ? [draft.id] : []))
    const removedIds = current.data.map(item => item.id).filter(id => !retainedIds.has(id))
    if (removedIds.length) {
      const deletion = await this.supabase.client.from('training_schedule_item').delete()
        .eq('id_user', userId).in('id', removedIds)
      if (deletion.error) return Promise.reject(deletion.error)
    }

    if (!drafts.length) return
    const values: TrainingScheduleItemInsert[] = drafts.map(draft => ({
      id_user: userId,
      schedule_id: scheduleId,
      exercise_id: draft.exerciseId,
      weekday,
      set_count: draft.setCount,
      target_repetitions: draft.targetRepetitions,
      target_weight_kg: draft.targetWeightKg,
      sort_order: draft.sortOrder,
      updated_at: new Date().toISOString(),
    }))
    const query = await this.supabase.client.from('training_schedule_item').upsert(values, {
      onConflict: 'schedule_id,weekday,exercise_id',
    })
    if (query.error) return Promise.reject(query.error)
  }
}
