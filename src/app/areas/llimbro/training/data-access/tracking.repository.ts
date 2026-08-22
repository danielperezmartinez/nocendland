import {Injectable} from '@angular/core'
import {AuthService} from '@platform/auth/auth.service'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {
  TrainingEntryDraft,
  TrainingEntryInsert,
  TrainingEntryWithDetails,
  TrainingExerciseHistoryEntry,
  TrainingSetInsert,
} from '../models/training.models'

const HISTORY_PAGE_SIZE = 500

@Injectable()
export class TrackingRepository {
  constructor(private readonly supabase: SupabaseClientService, private readonly auth: AuthService) {}

  async readByDate(date: string): Promise<TrainingEntryWithDetails[]> {
    const query = await this.supabase.client.from('training_entry')
      .select('*, training_exercise(*), training_set(*)')
      .eq('id_user', this.auth.requireUserId()).eq('performed_on', date)
      .order('sort_order')
    if (query.error) return Promise.reject(query.error)
    return query.data.map(entry => ({
      ...entry,
      training_set: [...entry.training_set].sort((left, right) => left.position - right.position),
    }))
  }

  async readByExercise(exerciseId: number): Promise<TrainingExerciseHistoryEntry[]> {
    const entries: TrainingExerciseHistoryEntry[] = []
    let offset = 0

    while (true) {
      const query = await this.supabase.client.from('training_entry')
        .select('*, training_set(*)')
        .eq('id_user', this.auth.requireUserId())
        .eq('exercise_id', exerciseId)
        .order('performed_on')
        .order('position', {referencedTable: 'training_set'})
        .range(offset, offset + HISTORY_PAGE_SIZE - 1)
      if (query.error) return Promise.reject(query.error)

      entries.push(...query.data)
      if (query.data.length < HISTORY_PAGE_SIZE) return entries
      offset += HISTORY_PAGE_SIZE
    }
  }

  async readRecentBeforeByExercise(
    exerciseId: number,
    beforeDate: string,
  ): Promise<TrainingExerciseHistoryEntry[]> {
    const query = await this.supabase.client.from('training_entry')
      .select('*, training_set(*)')
      .eq('id_user', this.auth.requireUserId())
      .eq('exercise_id', exerciseId)
      .lt('performed_on', beforeDate)
      .order('performed_on', {ascending: false})
      .limit(2)
    if (query.error) return Promise.reject(query.error)
    return query.data.map(entry => ({
      ...entry,
      training_set: [...entry.training_set].sort((left, right) => left.position - right.position),
    }))
  }

  async replaceDate(date: string, drafts: readonly TrainingEntryDraft[]): Promise<void> {
    const userId = this.auth.requireUserId()
    const current = await this.supabase.client.from('training_entry').select('id')
      .eq('id_user', userId).eq('performed_on', date)
    if (current.error) return Promise.reject(current.error)

    const retainedEntryIds = new Set(drafts.flatMap(draft => draft.id ? [draft.id] : []))
    const removedEntryIds = current.data.map(item => item.id).filter(id => !retainedEntryIds.has(id))
    if (removedEntryIds.length) {
      const deletion = await this.supabase.client.from('training_entry').delete()
        .eq('id_user', userId).in('id', removedEntryIds)
      if (deletion.error) return Promise.reject(deletion.error)
    }

    for (const draft of drafts) {
      const entryValue: TrainingEntryInsert = {
        id_user: userId,
        exercise_id: draft.exerciseId,
        performed_on: date,
        sort_order: draft.sortOrder,
        updated_at: new Date().toISOString(),
      }
      const entryQuery = await this.supabase.client.from('training_entry').upsert(entryValue, {
        onConflict: 'id_user,performed_on,exercise_id',
      }).select().single()
      if (entryQuery.error) return Promise.reject(entryQuery.error)

      const currentSets = await this.supabase.client.from('training_set').select('id')
        .eq('id_user', userId).eq('entry_id', entryQuery.data.id)
      if (currentSets.error) return Promise.reject(currentSets.error)
      const retainedSetIds = new Set(draft.sets.flatMap(set => set.id ? [set.id] : []))
      const removedSetIds = currentSets.data.map(set => set.id).filter(id => !retainedSetIds.has(id))
      if (removedSetIds.length) {
        const deletion = await this.supabase.client.from('training_set').delete()
          .eq('id_user', userId).in('id', removedSetIds)
        if (deletion.error) return Promise.reject(deletion.error)
      }

      const setValues: TrainingSetInsert[] = draft.sets.map(set => ({
        id_user: userId,
        entry_id: entryQuery.data.id,
        position: set.position,
        repetitions: set.repetitions,
        weight_kg: set.weightKg,
        updated_at: new Date().toISOString(),
      }))
      const setQuery = await this.supabase.client.from('training_set').upsert(setValues, {
        onConflict: 'entry_id,position',
      })
      if (setQuery.error) return Promise.reject(setQuery.error)
    }
  }
}
