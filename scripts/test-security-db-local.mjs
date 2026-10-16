import {spawnSync} from 'node:child_process'
import {cp, mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

// Ejecuta los tests pgTAP de supabase/tests contra una base local de Docker
// construida solo con las migraciones del repo. Usa un proyecto y puertos
// propios para no chocar con otras pilas locales de Supabase, y nunca se conecta
// al proyecto remoto compartido. `--keep` deja la base arrancada al terminar.
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
const workdir = join(tmpdir(), 'nocendland-security-db')
const keepRunning = process.argv.includes('--keep')
const config = `project_id = "nocendland-security-db"

[api]
port = 56431

[db]
port = 56432
shadow_port = 56430
major_version = 17

[studio]
enabled = false
`

await rm(join(workdir, 'supabase', 'migrations'), {recursive: true, force: true})
await rm(join(workdir, 'supabase', 'tests'), {recursive: true, force: true})
await mkdir(join(workdir, 'supabase'), {recursive: true})
await writeFile(join(workdir, 'supabase', 'config.toml'), config)
await cp(join(repositoryRoot, 'supabase', 'migrations'), join(workdir, 'supabase', 'migrations'), {recursive: true})
await cp(join(repositoryRoot, 'supabase', 'tests'), join(workdir, 'supabase', 'tests'), {recursive: true})

// La imagen local de Supabase trae pg_net instalado con permisos para anon que
// concede supabase_admin, mientras que devappsdpm-db no lo tiene. Para que la base
// de pruebas se parezca al remoto se retira antes de los tests; a cambio, ninguna
// migración puede instalar extensiones con salida a red sin pasar por revisión.
const networkExtensionPattern = /create\s+extension[^;]*\b(?:pg_net|http)\b/i
const migrationFiles = await readdir(join(repositoryRoot, 'supabase', 'migrations'))
for (const file of migrationFiles) {
  const content = await readFile(join(repositoryRoot, 'supabase', 'migrations', file), 'utf8')
  if (networkExtensionPattern.test(content)) {
    console.error(`${file} instala pg_net o http: revisa sus permisos y adapta este script y el test 6.`)
    process.exit(1)
  }
}

const steps = [
  () => supabase('db', 'start'),
  () => supabase('db', 'reset', '--local', '--no-seed'),
  () => dropLocalNetworkExtensions(),
  () => supabase('test', 'db', '--local'),
]
let status = 0
for (const step of steps) {
  status = step()
  if (status !== 0) break
}
if (!keepRunning) supabase('stop', '--no-backup')
process.exit(status)

/** Retira pg_net de la base local de pruebas; solo actúa sobre el contenedor propio. */
function dropLocalNetworkExtensions() {
  const result = spawnSync('docker', [
    'exec', 'supabase_db_nocendland-security-db',
    'psql', '-U', 'supabase_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1',
    '-c', 'drop extension if exists pg_net cascade',
  ], {stdio: 'inherit'})
  return result.status ?? 1
}

/** Invoca la CLI de Supabase fijada en el lockfile sobre el directorio de trabajo temporal. */
function supabase(...args) {
  const result = spawnSync('pnpm', ['exec', 'supabase', ...args, '--workdir', workdir], {
    cwd: repositoryRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  return result.status ?? 1
}
