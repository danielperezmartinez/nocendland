import {Injectable} from '@angular/core'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {
  TrainingExercise,
  TrainingShare,
  TrainingShareCreated,
  TrainingShareImportOptions,
  TrainingShareImportResult,
  TrainingSharePreview,
  TrainingShareType,
} from '../models/training.models'
import {TrainingShareError, TrainingShareErrorCode} from '../models/share-errors'

type FunctionResponse<T> = {data: T | null; error: {message: string; context?: unknown} | null}

@Injectable()
export class ShareRepository {
  constructor(private readonly supabase: SupabaseClientService) {}

  async create(type: TrainingShareType, exerciseIds: readonly number[], scheduleId?: number): Promise<TrainingShareCreated> {
    const response = await this.invoke<TrainingShareCreated>({action: 'create', type, exerciseIds, scheduleId})
    return response
  }

  async preview(token: string): Promise<TrainingSharePreview> {
    return this.invoke<TrainingSharePreview>({action: 'preview', token})
  }

  async import(token: string, options: TrainingShareImportOptions): Promise<TrainingShareImportResult> {
    return this.invoke<TrainingShareImportResult>({action: 'import', token, ...options})
  }

  async list(): Promise<TrainingShare[]> {
    const query = await this.supabase.client.from('training_share').select('*')
      .order('created_at', {ascending: false})
    if (query.error) return Promise.reject(query.error)
    return query.data
  }

  async revoke(shareId: string): Promise<void> {
    await this.invoke<{revoked: true}>({action: 'revoke', shareId})
  }

  async readExerciseMatches(portableIds: readonly string[], names: readonly string[]): Promise<TrainingExercise[]> {
    const portableQuery = portableIds.length
      ? await this.supabase.client.from('training_exercise').select('*').in('portable_id', [...portableIds])
      : {data: [] as TrainingExercise[], error: null}
    if (portableQuery.error) return Promise.reject(portableQuery.error)
    const matchedPortableIds = new Set(portableQuery.data.map(exercise => exercise.portable_id))
    const unmatchedNames = names.filter((_, index) => !matchedPortableIds.has(portableIds[index]))
    if (!unmatchedNames.length) return portableQuery.data
    const nameQuery = await this.supabase.client.from('training_exercise').select('*').in('name', unmatchedNames)
    if (nameQuery.error) return Promise.reject(nameQuery.error)
    return [...portableQuery.data, ...nameQuery.data.filter(exercise =>
      !portableQuery.data.some(existing => existing.id === exercise.id))]
  }

  private async invoke<T>(body: Record<string, unknown>): Promise<T> {
    const response = await this.supabase.client.functions.invoke('training-share', {body}) as FunctionResponse<T>
    if (response.error) return Promise.reject(new TrainingShareError(await readErrorCode(response.error)))
    if (!response.data) return Promise.reject(new TrainingShareError('training_share_failed'))
    return response.data
  }
}

/** Extrae el código público de la respuesta de error de la función, si lo trae. */
async function readErrorCode(error: {context?: unknown}): Promise<TrainingShareErrorCode> {
  if (!(error.context instanceof Response)) return 'training_share_failed'
  try {
    const body = await error.context.json() as {code?: unknown}
    return typeof body.code === 'string' ? body.code as TrainingShareErrorCode : 'training_share_failed'
  } catch {
    return 'training_share_failed'
  }
}
