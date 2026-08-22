import {access, readdir, readFile} from 'node:fs/promises'
import {extname, join, relative, resolve, sep} from 'node:path'
import {fileURLToPath} from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
const appDirectory = join(repositoryRoot, 'src', 'app')
const sharedUiDirectory = join(appDirectory, 'shared', 'ui')
const sharedUtilitiesDirectory = join(appDirectory, 'shared', 'utilities')
const platformDirectory = join(appDirectory, 'platform')
const catalogueDirectory = join(repositoryRoot, 'docs', 'Catálogo técnico')
const sharedPrimitivesPath = join(repositoryRoot, 'src', 'styles', 'components.scss')
const tsconfigPath = join(repositoryRoot, 'tsconfig.json')
const violations = []

const [appFiles, sharedUiFiles, utilityFiles, platformFiles, styleFiles, catalogueFiles, tsconfig] = await Promise.all([
  collectFiles(appDirectory, '.ts'),
  collectFiles(sharedUiDirectory, '.ts'),
  collectFiles(sharedUtilitiesDirectory, '.ts'),
  collectFiles(platformDirectory, '.ts'),
  collectFiles(join(repositoryRoot, 'src'), '.scss'),
  collectFiles(catalogueDirectory, '.md'),
  readFile(tsconfigPath, 'utf8'),
])

const entries = await Promise.all(catalogueFiles.map(readCatalogueEntry))
const sources = new Set(entries.map(entry => entry.Fuente))
const names = new Set()

for (const entry of entries) {
  for (const property of ['Nombre', 'Tipo', 'Área', 'Feature', 'Estado', 'Ámbito', 'Fuente', 'Resumen']) {
    if (!entry[property]) violations.push(`${entry.file}: falta la propiedad ${property}`)
  }
  if (entry.Nombre && names.has(entry.Nombre)) violations.push(`${entry.file}: la pieza ${entry.Nombre} está duplicada`)
  names.add(entry.Nombre)
  if (entry.Estado && !['Vigente', 'En revisión', 'Obsoleta'].includes(entry.Estado)) {
    violations.push(`${entry.file}: el estado ${entry.Estado} no es válido`)
  }
  if (entry.Fuente) {
    try {
      await access(join(repositoryRoot, ...entry.Fuente.split('/')))
    } catch {
      violations.push(`${entry.file}: la fuente ${entry.Fuente} no existe`)
    }
    if (!entry.content.includes(`](../../${entry.Fuente})`)) {
      violations.push(`${entry.file}: no enlaza su fuente desde la nota`)
    }
  }
}

const reusableModules = [
  ...sharedUiFiles.filter(file => !file.endsWith('.spec.ts') && /\.(?:component|service|directive)\.ts$/.test(file)),
  ...utilityFiles.filter(file => !file.endsWith('.spec.ts')),
  ...platformFiles.filter(file => !file.endsWith('.spec.ts') && /\.(?:service|guard)\.ts$/.test(file)),
  ...appFiles.filter(file => !file.endsWith('.spec.ts') && file.endsWith('.store.ts')),
]
for (const reusableModule of reusableModules) {
  const sourcePath = normalizePath(relative(repositoryRoot, reusableModule))
  if (!sources.has(sourcePath)) violations.push(`${sourcePath} no está registrado en el catálogo técnico`)
}

const publicEntrypoints = new Set(
  [...tsconfig.matchAll(/"(@shared\/ui\/[^"\s]+)"\s*:/g)].map(match => match[1]),
)
const documentedEntrypoints = new Set(entries.map(entry => entry['Entrada pública']).filter(Boolean))
for (const entrypoint of publicEntrypoints) {
  if (!documentedEntrypoints.has(entrypoint)) violations.push(`${entrypoint} no está registrado como entrada pública`)
}

for (const file of sharedUiFiles.filter(file => !file.endsWith('.spec.ts'))) {
  const content = await readFile(file, 'utf8')
  const sourcePath = normalizePath(relative(repositoryRoot, file))
  if (/\bany\b/.test(content)) violations.push(`${sourcePath} contiene el tipo any`)
  if (/getNestedProperty/.test(content)) violations.push(`${sourcePath} utiliza rutas de propiedades como texto`)
}

for (const file of appFiles.filter(file => !isInside(file, sharedUiDirectory))) {
  const content = await readFile(file, 'utf8')
  const imports = [...content.matchAll(/from\s+['"](@shared\/ui(?:\/[^'"]+)?)['"]/g)].map(match => match[1])
  for (const importedModule of imports) {
    if (!publicEntrypoints.has(importedModule)) {
      violations.push(`${normalizePath(relative(repositoryRoot, file))} importa ${importedModule}, que no es un entrypoint público`)
    }
  }
}

const primitiveNames = new Set()
const primitives = await readFile(sharedPrimitivesPath, 'utf8')
for (const match of primitives.matchAll(/^\s*(\.ui-[a-z0-9-]+)\s*(?:,|\{)/gim)) primitiveNames.add(match[1])
for (const primitiveName of primitiveNames) {
  if (!names.has(primitiveName)) violations.push(`${primitiveName} no está registrado en el catálogo técnico`)
}

for (const file of styleFiles.filter(file => resolve(file) !== resolve(sharedPrimitivesPath))) {
  const content = await readFile(file, 'utf8')
  if (/^\s*\.ui-[a-z0-9-]+(?::[a-z-]+)?\s*(?:,|\{)/im.test(content)) {
    violations.push(`${normalizePath(relative(repositoryRoot, file))} redefine una primitiva .ui-* fuera del sistema central`)
  }
}

if (violations.length > 0) {
  console.error('El catálogo técnico y sus superficies reutilizables incumplen su contrato:')
  violations.forEach(violation => console.error(`- ${violation}`))
  process.exitCode = 1
} else {
  console.log(`Catálogo técnico sincronizado: ${entries.length} piezas estructuradas y fuentes verificadas.`)
}

async function readCatalogueEntry(file) {
  const content = await readFile(file, 'utf8')
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const entry = {file: normalizePath(relative(repositoryRoot, file)), content}
  if (!frontmatter) {
    violations.push(`${entry.file}: falta el frontmatter`)
    return entry
  }
  for (const line of frontmatter[1].split(/\r?\n/)) {
    const match = line.match(/^([^:]+):\s*(.*)$/)
    if (!match) continue
    entry[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return entry
}

async function collectFiles(directory, extension) {
  const entries = await readdir(directory, {withFileTypes: true})
  const files = await Promise.all(entries.map(entry => {
    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) return collectFiles(entryPath, extension)
    return extname(entry.name) === extension ? [entryPath] : []
  }))
  return files.flat()
}

function isInside(file, directory) {
  return resolve(file).startsWith(`${resolve(directory)}${sep}`)
}

function normalizePath(path) {
  return path.split(sep).join('/')
}
