import {spawnSync} from 'node:child_process'
import {dropLocalNetworkExtensions, prepareWorkdir, repositoryRoot, supabase} from './local-supabase.mjs'

// Ejecuta las pruebas de accesibilidad (AXE) también en las rutas tras inicio de
// sesión. Levanta una pila local de Supabase con las migraciones del repo y pasa
// sus claves a Playwright, que redirige a ella todas las peticiones que la app
// hace al proyecto remoto. Las claves son las de demostración de la CLI local.
// `--keep` deja la pila arrancada al terminar.
const projectId = 'nocendland-e2e'
const keepRunning = process.argv.includes('--keep')
const workdir = await prepareWorkdir(projectId, `
[api]
port = 56441
schemas = ["public", "graphql_public", "nocendland"]

[db]
port = 56442
shadow_port = 56440
major_version = 17

[studio]
enabled = false

[inbucket]
enabled = false

[analytics]
enabled = false

[realtime]
enabled = false

[edge_runtime]
enabled = false

[auth]
site_url = "http://localhost:4310"
enable_signup = true

[auth.email]
enable_confirmations = false
`)

// La migración principal fija pgrst.db_schemas con gift_card, que en local no
// existe y hace fallar PostgREST. Se arranca sin él, se ajusta solo en la base
// local y después se levanta el resto de servicios. Se parte siempre de cero.
const skipped = 'imgproxy,postgres-meta,supavisor,vector,logflare'
supabase(workdir, ['stop', '--no-backup'])
let status = supabase(workdir, ['start', '-x', `${skipped},postgrest`]).status ?? 1
if (status === 0) status = localPsql(
  "alter role authenticator set pgrst.db_schemas = 'public, graphql_public, nocendland'",
)
if (status === 0) status = dropLocalNetworkExtensions(projectId)
// Una pila ya arrancada no levanta servicios nuevos: se para conservando el volumen
// (con el ajuste anterior) y se vuelve a arrancar con PostgREST.
if (status === 0) status = supabase(workdir, ['stop']).status ?? 1
if (status === 0) status = supabase(workdir, ['start', '-x', skipped]).status ?? 1
if (status === 0) {
  const keys = JSON.parse(supabase(workdir, ['status', '-o', 'json'], {capture: true}).stdout)
  const playwright = spawnSync('pnpm', ['exec', 'playwright', 'test', ...process.argv.slice(2).filter(arg => arg !== '--keep')], {
    cwd: repositoryRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      E2E_SUPABASE_URL: keys.API_URL,
      E2E_SUPABASE_ANON_KEY: keys.ANON_KEY,
      E2E_SUPABASE_SERVICE_ROLE_KEY: keys.SERVICE_ROLE_KEY,
    },
  })
  status = playwright.status ?? 1
}
if (!keepRunning) supabase(workdir, ['stop', '--no-backup'])
process.exit(status)

/** Ejecuta una sentencia como postgres en la base local de este proyecto. */
function localPsql(sql) {
  const result = spawnSync('docker', [
    'exec', `supabase_db_${projectId}`, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', sql,
  ], {stdio: 'inherit'})
  return result.status ?? 1
}
