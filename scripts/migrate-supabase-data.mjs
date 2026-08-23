import {createHash} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'

const sourceUrl = 'https://hzwxzvupsctlyrqcdofi.supabase.co'
const destinationUrl = 'https://zckqbrwdgxohdymiwbfz.supabase.co'
const storageBucket = 'nocendland'

const sourceServiceKey = process.env.NOCENDLAND_SOURCE_SERVICE_KEY
const destinationServiceKey = process.env.NOCENDLAND_DESTINATION_SERVICE_KEY

if (!sourceServiceKey || !destinationServiceKey) {
  throw new Error('missing_migration_service_keys')
}

const source = createClient(sourceUrl, sourceServiceKey, {
  auth: {autoRefreshToken: false, persistSession: false},
  db: {schema: 'public'},
})
const destination = createClient(destinationUrl, destinationServiceKey, {
  auth: {autoRefreshToken: false, persistSession: false},
  db: {schema: 'nocendland'},
})

const tables = [
  {name: 'user', conflict: 'id', order: ['id']},
  {name: 'nutrition_ingredient', conflict: 'id', order: ['id']},
  {name: 'nutrition_intake', conflict: 'id', order: ['id']},
  {name: 'nutrition_objective', conflict: 'level,id_user', order: ['level', 'id_user']},
  {name: 'nutrition_objetive_level', conflict: 'id', order: ['id']},
  {name: 'training_exercise', conflict: 'id', order: ['id']},
  {name: 'training_share', conflict: 'id', order: ['id']},
  {name: 'training_schedule', conflict: 'id', order: ['is_active:desc', 'id']},
  {name: 'training_schedule_item', conflict: 'id', order: ['id']},
  {name: 'training_entry', conflict: 'id', order: ['id']},
  {name: 'training_set', conflict: 'id', order: ['id']},
]

await migrateUsers()
const dataSummary = await migrateTables()
const storageSummary = await migrateStorage()
await verifyTables(dataSummary)

console.log(JSON.stringify({
  users: dataSummary.user,
  tableRows: dataSummary,
  storage: storageSummary,
}, null, 2))

async function migrateUsers() {
  const sourceUsers = await listAllUsers(source)
  const destinationUsers = await listAllUsers(destination)
  const destinationIds = new Set(destinationUsers.map(user => user.id))

  for (const user of sourceUsers) {
    if (destinationIds.has(user.id)) continue

    const appMetadata = {...user.app_metadata}
    delete appMetadata.provider
    delete appMetadata.providers

    const attributes = {
      id: user.id,
      email: user.email,
      phone: user.phone || undefined,
      email_confirm: Boolean(user.email_confirmed_at),
      phone_confirm: Boolean(user.phone_confirmed_at),
      user_metadata: user.user_metadata,
      app_metadata: appMetadata,
    }
    const {error} = await destination.auth.admin.createUser(attributes)
    if (error) throw new Error(`auth_user_migration_failed:${error.message}`)
  }

  const migratedUsers = await listAllUsers(destination)
  const sourceIds = sourceUsers.map(user => user.id).sort()
  const migratedIds = migratedUsers.map(user => user.id).filter(id => sourceIds.includes(id)).sort()
  if (JSON.stringify(sourceIds) !== JSON.stringify(migratedIds)) {
    throw new Error('auth_user_verification_failed')
  }
}

async function listAllUsers(client) {
  const users = []
  for (let page = 1; ; page += 1) {
    const {data, error} = await client.auth.admin.listUsers({page, perPage: 100})
    if (error) throw new Error(`auth_user_list_failed:${error.message}`)
    users.push(...data.users)
    if (data.users.length < 100) return users
  }
}

async function migrateTables() {
  const summary = {}
  for (const table of tables) {
    const rows = await readTable(source, table)
    if (rows.length) {
      const {error} = await destination
        .from(table.name)
        .upsert(rows, {onConflict: table.conflict})
      if (error) throw new Error(`table_migration_failed:${table.name}:${error.message}`)
    }
    summary[table.name] = rows.length
  }
  return summary
}

async function verifyTables(summary) {
  for (const table of tables) {
    const sourceRows = await readTable(source, table)
    const destinationRows = await readTable(destination, table)
    if (destinationRows.length !== summary[table.name]) {
      throw new Error(`table_count_mismatch:${table.name}`)
    }
    if (hashJson(sourceRows) !== hashJson(destinationRows)) {
      throw new Error(`table_content_mismatch:${table.name}`)
    }
  }
}

async function readTable(client, table) {
  let query = client.from(table.name).select('*')
  for (const order of table.order) {
    const [column, direction] = order.split(':')
    query = query.order(column, {ascending: direction !== 'desc'})
  }
  const {data, error} = await query
  if (error) throw new Error(`table_read_failed:${table.name}:${error.message}`)
  return data
}

async function migrateStorage() {
  const {data: existingBucket, error: bucketError} = await destination.storage.getBucket(storageBucket)
  if (bucketError && bucketError.message !== 'Bucket not found') {
    throw new Error(`destination_bucket_read_failed:${bucketError.message}`)
  }
  if (!existingBucket) {
    const {error} = await destination.storage.createBucket(storageBucket, {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg'],
    })
    if (error) throw new Error(`destination_bucket_create_failed:${error.message}`)
  }

  const paths = await listStoragePaths('')
  let bytes = 0
  for (const path of paths) {
    const sourceFile = await download(source, path)
    const {error} = await destination.storage.from(storageBucket).upload(path, sourceFile, {
      contentType: sourceFile.type || 'application/octet-stream',
      upsert: true,
    })
    if (error) throw new Error(`storage_upload_failed:${error.message}`)

    const destinationFile = await download(destination, path)
    const sourceBytes = new Uint8Array(await sourceFile.arrayBuffer())
    const destinationBytes = new Uint8Array(await destinationFile.arrayBuffer())
    if (hashBytes(sourceBytes) !== hashBytes(destinationBytes)) {
      throw new Error('storage_content_mismatch')
    }
    bytes += sourceBytes.byteLength
  }
  return {objects: paths.length, bytes}
}

async function listStoragePaths(prefix) {
  const {data, error} = await source.storage.from(storageBucket).list(prefix, {
    limit: 1000,
    sortBy: {column: 'name', order: 'asc'},
  })
  if (error) throw new Error(`storage_list_failed:${error.message}`)

  const paths = []
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.id) paths.push(path)
    else paths.push(...await listStoragePaths(path))
  }
  return paths
}

async function download(client, path) {
  const {data, error} = await client.storage.from(storageBucket).download(path)
  if (error) throw new Error(`storage_download_failed:${error.message}`)
  return data
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function hashBytes(value) {
  return createHash('sha256').update(value).digest('hex')
}
