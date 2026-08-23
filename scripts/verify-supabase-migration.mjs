import {randomUUID} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'

const destinationUrl = 'https://zckqbrwdgxohdymiwbfz.supabase.co'
const destinationServiceKey = process.env.NOCENDLAND_DESTINATION_SERVICE_KEY
const destinationPublishableKey = process.env.NOCENDLAND_DESTINATION_PUBLISHABLE_KEY

if (!destinationServiceKey || !destinationPublishableKey) {
  throw new Error('missing_verification_keys')
}

const admin = createClient(destinationUrl, destinationServiceKey, {
  auth: {autoRefreshToken: false, persistSession: false},
  db: {schema: 'nocendland'},
})
const anonymous = createClient(destinationUrl, destinationPublishableKey, {
  auth: {autoRefreshToken: false, persistSession: false},
  db: {schema: 'nocendland'},
})

const password = `Migration-${randomUUID()}!`
const owner = createUserClient()
const other = createUserClient()
const users = [await createVerificationUser('owner'), await createVerificationUser('other')]
let ownerStoragePath

try {
  await signIn(owner, users[0].email)
  await signIn(other, users[1].email)

  const anonymousRead = await anonymous.from('nutrition_ingredient').select('id').limit(1)
  if (!anonymousRead.error) throw new Error('anonymous_database_access_was_not_denied')

  for (const user of users) await ensureProfile(user.client, user)

  const ingredient = await insertSingle(owner, 'nutrition_ingredient', {
    id_user: users[0].id,
    name: `Verification ${randomUUID()}`,
    calories_per_100: 100,
    proteins_per_100: 10,
    fats_per_100: 2,
    carbohydrates_per_100: 15,
    grams_per_unit: 100,
  })
  await expectNoRows(other.from('nutrition_ingredient').select('id').eq('id', ingredient.id))

  await insertSingle(owner, 'nutrition_intake', {
    id_user: users[0].id,
    ingredient: ingredient.id,
    quantity_in_grams: 150,
    units: 1,
  })
  await insertSingle(owner, 'nutrition_objective', {
    id_user: users[0].id,
    level: 'keep',
    calories: 2000,
    proteins: 140,
    fats: 60,
    carbohydrates: 220,
  })
  await expectRows(owner.from('nutrition_intake_with_totals').select('*'), 1)
  await expectRows(owner.from('nutrition_objectives_totals').select('*'), 1)

  const exercise = await insertSingle(owner, 'training_exercise', {
    id_user: users[0].id,
    name: `Verification ${randomUUID()}`,
    tips: ['Verificación'],
    training_modalities: ['strength'],
    muscle_groups: ['full_body'],
    movement_patterns: ['push'],
  })
  const scheduleResponse = await owner.rpc('ensure_training_schedule')
  if (scheduleResponse.error || !scheduleResponse.data) {
    throw new Error(`schedule_rpc_failed:${scheduleResponse.error?.message}`)
  }
  const schedule = scheduleResponse.data

  await insertSingle(owner, 'training_schedule_item', {
    id_user: users[0].id,
    schedule_id: schedule.id,
    exercise_id: exercise.id,
    weekday: 1,
    set_count: 3,
    sort_order: 0,
  })
  const entry = await insertSingle(owner, 'training_entry', {
    id_user: users[0].id,
    exercise_id: exercise.id,
    performed_on: '2099-01-01',
    sort_order: 0,
  })
  await insertSingle(owner, 'training_set', {
    id_user: users[0].id,
    entry_id: entry.id,
    position: 1,
    repetitions: 10,
    weight_kg: 25,
  })

  ownerStoragePath = `training_exercise/${users[0].id}/${exercise.id}`
  const image = Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
    0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 240, 31,
    0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68,
    174, 66, 96, 130,
  ])
  const upload = await owner.storage.from('nocendland').upload(ownerStoragePath, image, {
    contentType: 'image/png',
    upsert: true,
  })
  if (upload.error) throw new Error(`storage_upload_failed:${upload.error.message}`)
  const download = await owner.storage.from('nocendland').download(ownerStoragePath)
  if (download.error || (await download.data.arrayBuffer()).byteLength !== image.byteLength) {
    throw new Error(`storage_download_failed:${download.error?.message}`)
  }
  const imageUpdate = await owner.from('training_exercise').update({image_path: ownerStoragePath})
    .eq('id', exercise.id)
  if (imageUpdate.error) throw new Error(`exercise_image_update_failed:${imageUpdate.error.message}`)

  const createdShare = await owner.functions.invoke('training-share', {
    body: {action: 'create', type: 'exercises', exerciseIds: [exercise.id]},
  })
  if (createdShare.error || !createdShare.data?.id || !createdShare.data?.token) {
    throw new Error(`share_creation_failed:${createdShare.error?.message}`)
  }
  const preview = await anonymous.functions.invoke('training-share', {
    body: {action: 'preview', token: createdShare.data.token},
  })
  if (preview.error || preview.data?.shareId !== createdShare.data.id) {
    throw new Error(`share_preview_failed:${preview.error?.message}`)
  }
  const revoked = await owner.functions.invoke('training-share', {
    body: {action: 'revoke', shareId: createdShare.data.id},
  })
  if (revoked.error || revoked.data?.revoked !== true) {
    throw new Error(`share_revoke_failed:${revoked.error?.message}`)
  }

  console.log(JSON.stringify({
    auth: 'passed',
    anonymousAccess: 'denied',
    crossUserRls: 'passed',
    nutrition: 'passed',
    training: 'passed',
    storage: 'passed',
    edgeFunction: 'passed',
  }, null, 2))
} finally {
  if (ownerStoragePath) {
    await admin.storage.from('nocendland').remove([ownerStoragePath])
  }
  for (const user of users) {
    await admin.from('nutrition_ingredient').delete().eq('id_user', user.id)
    await admin.from('nutrition_objetive_level').delete().eq('id_user', user.id)
    await admin.from('user').delete().eq('id', user.id)
    await deleteVerificationUser(user.id)
  }
}

function createUserClient() {
  return createClient(destinationUrl, destinationPublishableKey, {
    auth: {autoRefreshToken: false, persistSession: false},
    db: {schema: 'nocendland'},
  })
}

async function createVerificationUser(label) {
  const id = randomUUID()
  const email = `nocendland-${label}-${id}@example.invalid`
  const {data, error} = await admin.auth.admin.createUser({
    id,
    email,
    password,
    email_confirm: true,
    user_metadata: {name: `Verification ${label}`},
  })
  if (error || !data.user) throw new Error(`verification_user_creation_failed:${error?.message}`)
  return {id, email, client: label === 'owner' ? owner : other}
}

async function signIn(client, email) {
  const {error} = await client.auth.signInWithPassword({email, password})
  if (error) throw new Error(`verification_sign_in_failed:${error.message}`)
}

async function ensureProfile(client, user) {
  const {error} = await client.from('user').upsert({
    id: user.id,
    email: user.email,
    user_name: 'Verification',
    avatar_url: 'https://example.invalid/avatar.png',
  }, {onConflict: 'id'})
  if (error) throw new Error(`profile_creation_failed:${error.message}`)
}

async function insertSingle(client, table, values) {
  const {data, error} = await client.from(table).insert(values).select('*').single()
  if (error) throw new Error(`insert_failed:${table}:${error.message}`)
  return data
}

async function expectRows(query, expected) {
  const {data, error} = await query
  if (error || data.length !== expected) {
    throw new Error(`row_verification_failed:${error?.message}`)
  }
}

async function expectNoRows(query) {
  await expectRows(query, 0)
}

async function deleteVerificationUser(userId) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const deletion = await admin.auth.admin.deleteUser(userId)
    if (!deletion.error) return
    await new Promise(resolve => setTimeout(resolve, 500 * attempt))
  }
  console.error('verification_cleanup_failed')
}
