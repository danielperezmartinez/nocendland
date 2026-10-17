import {spawnSync} from 'node:child_process'
import {cp, mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

// Utilidades compartidas por los scripts que levantan una pila local de Supabase
// construida solo con las migraciones del repo. Cada pila usa un proyecto y unos
// puertos propios para no chocar con otras pilas locales, y nunca se conecta al
// proyecto remoto compartido devappsdpm-db.
export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))

/** Crea el directorio de trabajo temporal con su config, migraciones y tests. */
export async function prepareWorkdir(projectId, config) {
  const workdir = join(tmpdir(), projectId)
  await rm(join(workdir, 'supabase', 'migrations'), {recursive: true, force: true})
  await rm(join(workdir, 'supabase', 'tests'), {recursive: true, force: true})
  await mkdir(join(workdir, 'supabase'), {recursive: true})
  await writeFile(join(workdir, 'supabase', 'config.toml'), `project_id = "${projectId}"\n${config}`)
  await cp(join(repositoryRoot, 'supabase', 'migrations'), join(workdir, 'supabase', 'migrations'), {recursive: true})
  await cp(join(repositoryRoot, 'supabase', 'tests'), join(workdir, 'supabase', 'tests'), {recursive: true})
  return workdir
}

/** Invoca la CLI de Supabase fijada en el lockfile sobre un directorio de trabajo. */
export function supabase(workdir, args, options = {}) {
  return spawnSync('pnpm', ['exec', 'supabase', ...args, '--workdir', workdir], {
    cwd: repositoryRoot,
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
}

/**
 * La imagen local de Supabase trae pg_net instalado con permisos para anon que
 * concede supabase_admin, mientras que devappsdpm-db no lo tiene. Antes de los
 * tests se retira de la base local; a cambio, ninguna migración puede instalar
 * extensiones con salida a red sin revisar este script y el test 6 del catálogo.
 */
export async function assertNoNetworkExtensionsInMigrations() {
  const pattern = /create\s+extension[^;]*\b(?:pg_net|http)\b/i
  const directory = join(repositoryRoot, 'supabase', 'migrations')
  for (const file of await readdir(directory)) {
    if (pattern.test(await readFile(join(directory, file), 'utf8'))) {
      throw new Error(`${file} instala pg_net o http: revisa sus permisos y adapta los scripts locales.`)
    }
  }
}

/** Retira pg_net de la base local del proyecto indicado; solo actúa sobre su contenedor. */
export function dropLocalNetworkExtensions(projectId) {
  const result = spawnSync('docker', [
    'exec', `supabase_db_${projectId}`,
    'psql', '-U', 'supabase_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1',
    '-c', 'drop extension if exists pg_net cascade',
  ], {stdio: 'inherit'})
  return result.status ?? 1
}
