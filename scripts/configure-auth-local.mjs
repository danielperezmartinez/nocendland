import {execFileSync} from 'node:child_process'
import {writeFileSync} from 'node:fs'

// pnpm aporta su ejecutable al script sin recurrir a comandos de shell.
const status = JSON.parse(execFileSync(process.execPath, [process.env.npm_execpath,
  'exec', 'supabase', 'status', '--workdir', 'tests/auth-local', '--output', 'json'], {encoding: 'utf8'}))
if (status.API_URL !== 'http://127.0.0.1:55431') throw new Error('Expected the isolated local Auth project')
const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY
if (!key) throw new Error('Missing local public key')
writeFileSync('src/environments/environment.auth-local.ts', `import packageJson from '../../package.json';

export const environment = {
  production: false,
  emailAuthEnabled: true,
  supabaseUrl: ${JSON.stringify(status.API_URL)},
  supabaseKey: ${JSON.stringify(key)},
  version: packageJson.version,
}
`)
console.log('Entorno local de Auth preparado. Buzón: http://127.0.0.1:55434')
