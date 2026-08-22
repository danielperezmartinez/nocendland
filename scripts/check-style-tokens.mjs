import {readdir, readFile} from 'node:fs/promises'
import {extname, join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'

const sourceDirectoryUrl = new URL('../src/', import.meta.url)
const sourceDirectory = fileURLToPath(sourceDirectoryUrl)
const checkedExtensions = new Set(['.css', '.html', '.scss'])
const forbiddenPatterns = [
  {label: 'color hexadecimal', expression: /(?<!svg)#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})\b/i},
  {
    label: 'utilidad cromática directa de Tailwind',
    expression: /\b(?:bg|border|decoration|divide|from|outline|ring|shadow|text|to|via)-(?:amber|black|blue|cyan|emerald|fuchsia|gray|green|indigo|lime|neutral|orange|pink|purple|red|rose|sky|slate|stone|teal|violet|white|yellow|zinc)(?:-|\/|\b)/,
  },
]

const files = await collectFiles(sourceDirectory)
const violations = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const lines = content.split(/\r?\n/)

  lines.forEach((line, index) => {
    forbiddenPatterns.forEach(({label, expression}) => {
      if (expression.test(line)) {
        violations.push(`${relative(sourceDirectory, file)}:${index + 1} — ${label}`)
      }
    })
  })
}

if (violations.length > 0) {
  console.error('Se han encontrado colores fuera del sistema de tokens CSS:')
  violations.forEach(violation => console.error(`- ${violation}`))
  process.exitCode = 1
} else {
  console.log('Los estilos consumen exclusivamente el sistema cromático centralizado.')
}

async function collectFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const nestedFiles = await Promise.all(entries.map(entry => {
    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) return collectFiles(entryPath)
    return checkedExtensions.has(extname(entry.name)) ? [entryPath] : []
  }))

  return nestedFiles.flat()
}
