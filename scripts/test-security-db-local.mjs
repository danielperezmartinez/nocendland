import {
  assertNoNetworkExtensionsInMigrations,
  dropLocalNetworkExtensions,
  prepareWorkdir,
  supabase,
} from './local-supabase.mjs'

// Ejecuta los tests pgTAP de supabase/tests contra una base local de Docker
// construida solo con las migraciones del repo. `--keep` deja la base arrancada.
const projectId = 'nocendland-security-db'
const keepRunning = process.argv.includes('--keep')

await assertNoNetworkExtensionsInMigrations()
const workdir = await prepareWorkdir(projectId, `
[api]
port = 56431

[db]
port = 56432
shadow_port = 56430
major_version = 17

[studio]
enabled = false
`)

const steps = [
  () => supabase(workdir, ['db', 'start']).status,
  () => supabase(workdir, ['db', 'reset', '--local', '--no-seed']).status,
  () => dropLocalNetworkExtensions(projectId),
  () => supabase(workdir, ['test', 'db', '--local']).status,
]
let status = 0
for (const step of steps) {
  status = step() ?? 1
  if (status !== 0) break
}
if (!keepRunning) supabase(workdir, ['stop', '--no-backup'])
process.exit(status)
