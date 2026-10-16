import {readdir, readFile} from 'node:fs/promises'
import {join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'

// Comprueba que ninguna clave secreta de Supabase acaba en el bundle del cliente.
// Se ejecuta después de `pnpm run build`. La clave publicable puede ir en el
// cliente; la secreta (`sb_secret_…` o un JWT con rol `service_role`) nunca.
const buildDirectory = fileURLToPath(new URL('../dist/', import.meta.url))
const secretKeyPattern = /sb_secret_[\w-]+/g
const jwtPattern = /eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g

const files = await collectFiles(buildDirectory).catch(() => null)
if (!files?.length) {
  console.error('No se encontró dist/: ejecuta antes `pnpm run build`.')
  process.exit(1)
}

const violations = []
for (const file of files) {
  const content = await readFile(file, 'utf8')
  const location = relative(buildDirectory, file)
  for (const match of content.matchAll(secretKeyPattern)) {
    violations.push(`${location}: clave secreta ${match[0].slice(0, 14)}…`)
  }
  for (const match of content.matchAll(jwtPattern)) {
    if (decodeRole(match[0]) === 'service_role') {
      violations.push(`${location}: JWT con rol service_role`)
    }
  }
}

if (violations.length) {
  console.error('Se han encontrado secretos en el bundle:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}
console.log(`Bundle sin secretos: ${files.length} archivos revisados.`)

/** Devuelve el rol declarado en la carga útil de un JWT, o null si no se puede leer. */
function decodeRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

/** Recorre recursivamente un directorio y devuelve los archivos de texto del bundle. */
async function collectFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return collectFiles(path)
    return /\.(?:js|mjs|html|json|txt|webmanifest)$/.test(entry.name) ? [path] : []
  }))
  return nested.flat()
}
