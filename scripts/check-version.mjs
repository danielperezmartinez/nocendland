// Falla si la versión de package.json no supera la de la rama principal.
// Uso: node scripts/check-version.mjs <sha base>
// Reglas en docs/README.md, sección "Publicación".
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const baseSha = process.argv[2];
if (!baseSha) {
  console.error('Uso: node scripts/check-version.mjs <sha base>');
  process.exit(2);
}

const baseVersion = JSON.parse(
  execFileSync('git', ['show', `${baseSha}:package.json`], { encoding: 'utf8' }),
).version;
const currentVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;

// Compara major.minor.patch como números e ignora las etiquetas de prerelease.
const parse = (version) => version.split(/[.+-]/).slice(0, 3).map(Number);
const [base, current] = [parse(baseVersion), parse(currentVersion)];

for (let index = 0; index < 3; index++) {
  if (current[index] > base[index]) {
    console.log(`Versión ${currentVersion} > ${baseVersion}.`);
    process.exit(0);
  }
  if (current[index] < base[index]) break;
}

console.error(`La versión ${currentVersion} debe superar la de la rama principal (${baseVersion}).`);
process.exit(1);
