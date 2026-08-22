import '@supabase/functions-js/edge-runtime.d.ts'
import {createClient, SupabaseClient} from '@supabase/supabase-js'

const storageBucket = 'nocendland'
const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const anonymousKey = Deno.env.get('SUPABASE_ANON_KEY') as string
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const adminClient = createClient(supabaseUrl, serviceRoleKey, {auth: {persistSession: false}})

type ShareType = 'exercises' | 'schedule'
type ConflictAction = 'keep' | 'update'

interface ShareExercise {
  portableId: string
  name: string
  description: string | null
  tips: string[]
  imageKey: string | null
  imageUrl?: string
  videoUrl?: string | null
  trainingModalities?: string[]
  muscleGroups?: string[]
  movementPatterns?: string[]
}

interface ShareScheduleItem {
  exercisePortableId: string
  setCount: number
  targetRepetitions: number | null
  targetWeightKg: number | null
  sortOrder: number
}

interface ShareManifest {
  version: 'training-share/v1'
  type: ShareType
  title: string
  exercises: ShareExercise[]
  schedule?: {
    portableId: string
    name: string
    days: Array<{weekday: number; items: ShareScheduleItem[]}>
  }
}

interface RequestBody {
  action?: string
  type?: ShareType
  token?: string
  shareId?: string
  exerciseIds?: number[]
  scheduleId?: number
  activateSchedule?: boolean
  conflicts?: Record<string, ConflictAction>
}

interface UserContext {
  userId: string
  supabase: SupabaseClient
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {status, headers: corsHeaders})
}

function isShareType(value: unknown): value is ShareType {
  return value === 'exercises' || value === 'schedule'
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function asManifest(value: unknown): ShareManifest {
  const manifest = value as Partial<ShareManifest>
  if (manifest.version !== 'training-share/v1' || !isShareType(manifest.type) || !Array.isArray(manifest.exercises)) {
    throw new Error('invalid_training_share_manifest')
  }
  return manifest as ShareManifest
}

export default {
  fetch: async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: corsHeaders})
    if (request.method !== 'POST') return json({message: 'Method not allowed'}, 405)

    try {
      const body = await request.json() as RequestBody
      if (body.action === 'preview') return await previewShare(body, adminClient)

      const authenticated = await authenticateUser(request)
      if (!authenticated) {
        return json({message: 'Authentication required'}, 401)
      }

      if (body.action === 'create') {
        return await createShare(body, authenticated, adminClient)
      }
      if (body.action === 'import') {
        return await importShare(body, authenticated, adminClient)
      }
      if (body.action === 'revoke') {
        return await revokeShare(body, authenticated, adminClient)
      }
      return json({message: 'Unknown action'}, 400)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      const status = message === 'schedule_already_imported' ? 409 : 400
      return json({message}, status)
    }
  },
}

async function authenticateUser(request: Request): Promise<UserContext | null> {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) return null
  const user = await adminClient.auth.getUser(token)
  if (user.error || !user.data.user) return null
  return {
    userId: user.data.user.id,
    supabase: createClient(supabaseUrl, anonymousKey, {
      auth: {persistSession: false},
      global: {headers: {Authorization: authorization}},
    }),
  }
}

async function createShare(
  body: RequestBody,
  context: UserContext,
  admin: SupabaseClient,
): Promise<Response> {
  if (!isShareType(body.type)) return json({message: 'Invalid share request'}, 400)
  const userId = context.userId
  const shareId = crypto.randomUUID()
  const token = randomToken()
  let manifest: ShareManifest
  const copiedImages: string[] = []

  try {
    if (body.type === 'exercises') {
      const exerciseIds = [...new Set(body.exerciseIds ?? [])]
      if (!exerciseIds.length) return json({message: 'Select at least one exercise'}, 400)
      const query = await context.supabase.from('training_exercise').select('*')
        .eq('id_user', userId).is('archived_at', null).in('id', exerciseIds)
      if (query.error || query.data.length !== exerciseIds.length) throw new Error('invalid_exercise_selection')
      const exercises = await snapshotExercises(query.data, shareId, admin, copiedImages)
      manifest = {
        version: 'training-share/v1',
        type: 'exercises',
        title: exercises.length === 1 ? exercises[0].name : `${exercises.length} ejercicios`,
        exercises,
      }
    } else {
      if (!Number.isInteger(body.scheduleId)) return json({message: 'Invalid schedule'}, 400)
      const scheduleQuery = await context.supabase.from('training_schedule').select('*')
        .eq('id_user', userId).eq('id', body.scheduleId as number).single()
      if (scheduleQuery.error) throw new Error('schedule_not_found')
      const itemsQuery = await context.supabase.from('training_schedule_item')
        .select('*, training_exercise(*)').eq('id_user', userId).eq('schedule_id', scheduleQuery.data.id)
        .order('weekday').order('sort_order')
      if (itemsQuery.error) throw new Error('schedule_not_found')
      const exercisesById = new Map(itemsQuery.data.map(item => [item.training_exercise.id, item.training_exercise]))
      const exercises = await snapshotExercises([...exercisesById.values()], shareId, admin, copiedImages)
      const portableById = new Map([...exercisesById.values()].map(exercise => [exercise.id, exercise.portable_id]))
      manifest = {
        version: 'training-share/v1',
        type: 'schedule',
        title: scheduleQuery.data.name,
        exercises,
        schedule: {
          portableId: scheduleQuery.data.portable_id,
          name: scheduleQuery.data.name,
          days: Array.from({length: 7}, (_, index) => ({
            weekday: index + 1,
            items: itemsQuery.data.filter(item => item.weekday === index + 1).map(item => ({
              exercisePortableId: portableById.get(item.exercise_id) as string,
              setCount: item.set_count,
              targetRepetitions: item.target_repetitions,
              targetWeightKg: item.target_weight_kg,
              sortOrder: item.sort_order,
            })),
          })),
        },
      }
    }

    const insertion = await admin.from('training_share').insert({
      id: shareId,
      owner_id: userId,
      token_hash: await hashToken(token),
      share_type: manifest.type,
      title: manifest.title,
      manifest,
    })
    if (insertion.error) throw new Error('share_creation_failed')
    return json({id: shareId, token})
  } catch (error) {
    if (copiedImages.length) await admin.storage.from(storageBucket).remove(copiedImages)
    throw error
  }
}

async function snapshotExercises(
  exercises: Array<{
    portable_id: string
    name: string
    description: string | null
    tips: string[]
    image_path: string | null
    video_url: string | null
    training_modalities: string[]
    muscle_groups: string[]
    movement_patterns: string[]
  }>,
  shareId: string,
  admin: SupabaseClient,
  copiedImages: string[],
): Promise<ShareExercise[]> {
  const snapshots: ShareExercise[] = []
  for (const exercise of exercises) {
    let imageKey: string | null = null
    if (exercise.image_path) {
      imageKey = `training_share/${shareId}/${exercise.portable_id}`
      const copied = await admin.storage.from(storageBucket).copy(exercise.image_path, imageKey)
      if (copied.error) throw new Error(`image_snapshot_failed:${exercise.name}`)
      copiedImages.push(imageKey)
    }
    snapshots.push({
      portableId: exercise.portable_id,
      name: exercise.name,
      description: exercise.description,
      tips: exercise.tips,
      imageKey,
      videoUrl: exercise.video_url,
      trainingModalities: exercise.training_modalities,
      muscleGroups: exercise.muscle_groups,
      movementPatterns: exercise.movement_patterns,
    })
  }
  return snapshots
}

async function previewShare(body: RequestBody, admin: SupabaseClient): Promise<Response> {
  if (!body.token || body.token.length < 32) return json({message: 'Share not found'}, 404)
  const query = await admin.from('training_share').select('id, manifest, created_at')
    .eq('token_hash', await hashToken(body.token)).is('revoked_at', null).single()
  if (query.error) return json({message: 'Share not found'}, 404)
  const manifest = asManifest(query.data.manifest)
  const exercises = await Promise.all(manifest.exercises.map(async exercise => {
    if (!exercise.imageKey) return exercise
    const signed = await admin.storage.from(storageBucket).createSignedUrl(exercise.imageKey, 900)
    return {...exercise, imageUrl: signed.error ? undefined : signed.data.signedUrl}
  }))
  return json({
    shareId: query.data.id,
    createdAt: query.data.created_at,
    manifest: {...manifest, exercises},
  })
}

async function importShare(
  body: RequestBody,
  context: UserContext,
  admin: SupabaseClient,
): Promise<Response> {
  if (!body.token) return json({message: 'Invalid import request'}, 400)
  const shareQuery = await admin.from('training_share').select('id, manifest')
    .eq('token_hash', await hashToken(body.token)).is('revoked_at', null).single()
  if (shareQuery.error) return json({message: 'Share not found'}, 404)
  const manifest = asManifest(shareQuery.data.manifest)
  const conflicts = body.conflicts ?? {}
  const rpc = await context.supabase.rpc('import_training_share_manifest', {
    shared_manifest: manifest,
    conflict_actions: conflicts,
    activate_schedule: body.activateSchedule ?? false,
    source_share: shareQuery.data.id,
  })
  if (rpc.error) throw new Error(rpc.error.message)
  const result = rpc.data as {
    exerciseIds: Record<string, number>
    scheduleId: number | null
    scheduleName: string | null
  }
  const imageFailures: string[] = []
  for (const exercise of manifest.exercises) {
    const exerciseId = result.exerciseIds[exercise.portableId]
    if (!exerciseId) continue
    if (!exercise.imageKey) {
      if (conflicts[exercise.portableId] === 'update') {
        await context.supabase.from('training_exercise').update({image_path: null})
          .eq('id_user', context.userId).eq('id', exerciseId)
      }
      continue
    }
    const downloaded = await admin.storage.from(storageBucket).download(exercise.imageKey)
    if (downloaded.error) {
      imageFailures.push(exercise.name)
      continue
    }
    const destination = `training_exercise/${context.userId}/${exerciseId}`
    const uploaded = await admin.storage.from(storageBucket).upload(destination, downloaded.data, {
      contentType: downloaded.data.type || 'application/octet-stream',
      upsert: true,
    })
    if (uploaded.error) {
      imageFailures.push(exercise.name)
      continue
    }
    const updated = await context.supabase.from('training_exercise').update({
      image_path: destination,
      updated_at: new Date().toISOString(),
    }).eq('id_user', context.userId).eq('id', exerciseId)
    if (updated.error) imageFailures.push(exercise.name)
  }
  return json({...result, imageFailures})
}

async function revokeShare(
  body: RequestBody,
  context: UserContext,
  admin: SupabaseClient,
): Promise<Response> {
  if (!body.shareId) return json({message: 'Invalid revoke request'}, 400)
  const shareQuery = await context.supabase.from('training_share').select('id, manifest')
    .eq('id', body.shareId).is('revoked_at', null).single()
  if (shareQuery.error) return json({message: 'Share not found'}, 404)
  const manifest = asManifest(shareQuery.data.manifest)
  const update = await admin.from('training_share').update({revoked_at: new Date().toISOString()})
    .eq('id', shareQuery.data.id).eq('owner_id', context.userId)
  if (update.error) throw new Error('share_revocation_failed')
  const images = manifest.exercises.flatMap(exercise => exercise.imageKey ? [exercise.imageKey] : [])
  if (images.length) await admin.storage.from(storageBucket).remove(images)
  return json({revoked: true})
}
