import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {randomUUID} from 'node:crypto'
import {setTimeout as pause} from 'node:timers/promises'
import {createClient} from '@supabase/supabase-js'

// Nunca acepta URL ni credenciales remotas: solo el proyecto local dedicado.
const status = JSON.parse(execFileSync(process.execPath, [process.env.npm_execpath,
  'exec', 'supabase', 'status', '--workdir', 'tests/auth-local', '--output', 'json'], {encoding: 'utf8'}))
assert.equal(status.API_URL, 'http://127.0.0.1:55431')
const mailbox = 'http://127.0.0.1:55434'
const clients = []
function client(key = status.PUBLISHABLE_KEY ?? status.ANON_KEY) {
  const result = createClient(status.API_URL, key, {
    db: {schema: 'nocendland'},
    auth: {flowType: 'pkce', detectSessionInUrl: false, persistSession: false, autoRefreshToken: false},
  })
  clients.push(result)
  return result
}
const admin = client(status.SECRET_KEY ?? status.SERVICE_ROLE_KEY)
const owned = new Map()
const messages = new Set()
const password = `Local-test-${randomUUID()}`
const email = () => `auth-${randomUUID()}@example.invalid`

function success(result) {
  assert.equal(result.error, null, result.error?.message)
  return result.data
}

async function codeFor(address, subject) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = await (await fetch(`${mailbox}/api/v1/messages?limit=100`)).json()
    const message = list.messages.find(item => item.To?.some(to => to.Address === address)
      && (!subject || item.Subject.includes(subject)) && !messages.has(item.ID))
    if (message) {
      const detail = await (await fetch(`${mailbox}/api/v1/message/${message.ID}`)).json()
      const code = (detail.Text ?? detail.HTML).match(/\b\d{6}\b/)?.[0]
      assert.ok(code, 'Expected a six-digit code in the local email')
      messages.add(message.ID)
      return code
    }
    await pause(250)
  }
  throw new Error('No local verification email received')
}

try {
  const first = client()
  const firstEmail = email()
  const signedUp = success(await first.auth.signUp({email: firstEmail, password}))
  owned.set(signedUp.user.id, firstEmail)
  assert.equal(signedUp.session, null)
  assert.ok((await first.auth.signInWithPassword({email: firstEmail, password})).error)
  const confirmation = await codeFor(firstEmail)
  const confirmed = success(await first.auth.verifyOtp({email: firstEmail, token: confirmation, type: 'email'}))
  assert.equal(confirmed.user.id, signedUp.user.id)
  assert.ok((await first.auth.verifyOtp({email: firstEmail, token: confirmation, type: 'email'})).error)
  success(await first.from('user').upsert({id: signedUp.user.id, email: firstEmail, user_name: 'Local test'}))
  success(await first.auth.signOut({scope: 'local'}))
  const login = success(await first.auth.signInWithPassword({email: firstEmail, password}))
  assert.equal(login.user.id, signedUp.user.id)
  assert.equal(success(await first.from('user').select('id')).length, 1)
  console.log('OK: registro con contraseña, confirmación, código consumido, login y perfil estable.')

  success(await first.auth.resetPasswordForEmail(firstEmail))
  const recovery = await codeFor(firstEmail, 'Recupera')
  const recovered = success(await first.auth.verifyOtp({email: firstEmail, token: recovery, type: 'recovery'}))
  assert.equal(recovered.user.id, signedUp.user.id)
  const replacement = `New-${randomUUID()}`
  success(await first.auth.updateUser({password: replacement}))
  success(await first.auth.signOut({scope: 'local'}))
  assert.ok((await first.auth.signInWithPassword({email: firstEmail, password})).error)
  success(await first.auth.signInWithPassword({email: firstEmail, password: replacement}))
  console.log('OK: recuperación por código, nueva contraseña y rechazo de la anterior.')

  const second = client()
  const secondEmail = email()
  success(await second.auth.signInWithOtp({email: secondEmail, options: {shouldCreateUser: true}}))
  const pending = success(await admin.auth.admin.listUsers()).users.find(user => user.email === secondEmail)
  assert.ok(pending)
  owned.set(pending.id, secondEmail)
  const registrationCode = await codeFor(secondEmail)
  // La segunda petición debe respetar el límite real de Supabase.
  const limited = await second.auth.signInWithOtp({email: secondEmail, options: {shouldCreateUser: true}})
  assert.ok(limited.error)
  const registered = success(await second.auth.verifyOtp({email: secondEmail, token: registrationCode, type: 'email'}))
  owned.set(registered.user.id, secondEmail)
  assert.deepEqual(success(await second.from('user').select('id')), [])
  assert.ok((await second.from('user').upsert({id: signedUp.user.id, email: firstEmail})).error)
  console.log('OK: registro por código, límite de reenvío y aislamiento RLS de perfiles.')

  const existingEmail = email()
  const existing = success(await admin.auth.admin.createUser({email: existingEmail, password, email_confirm: true})).user
  owned.set(existing.id, existingEmail)
  const third = client()
  assert.equal(success(await third.auth.signInWithPassword({email: existingEmail, password})).user.id, existing.id)
  success(await third.auth.signOut({scope: 'local'}))
  success(await third.auth.signInWithOtp({email: existingEmail, options: {shouldCreateUser: false}}))
  const loginCode = await codeFor(existingEmail)
  assert.ok((await third.auth.verifyOtp({email: existingEmail, token: loginCode === '000000' ? '111111' : '000000', type: 'email'})).error)
  const loggedIn = success(await third.auth.verifyOtp({email: existingEmail, token: loginCode, type: 'email'}))
  assert.equal(loggedIn.user.id, existing.id)
  const absentEmail = email()
  assert.ok((await third.auth.signInWithOtp({email: absentEmail, options: {shouldCreateUser: false}})).error)
  const all = success(await admin.auth.admin.listUsers()).users
  assert.equal(all.some(user => user.email === absentEmail), false)
  console.log('OK: código para cuenta existente, código incorrecto y login sin altas accidentales.')

  const expiredEmail = email()
  const fourth = client()
  const expiring = success(await fourth.auth.signUp({email: expiredEmail, password})).user
  owned.set(expiring.id, expiredEmail)
  const expiredCode = await codeFor(expiredEmail)
  assert.match(expiring.id, /^[0-9a-f-]{36}$/)
  execFileSync('docker', ['exec', 'supabase_db_nocendland-auth-local', 'psql', '-U', 'postgres', '-d', 'postgres',
    '-v', 'ON_ERROR_STOP=1', '-c', `update auth.users set confirmation_sent_at = now() - interval '1 day' where id = '${expiring.id}'`], {stdio: 'pipe'})
  assert.ok((await fourth.auth.verifyOtp({email: expiredEmail, token: expiredCode, type: 'email'})).error)
  console.log('OK: código caducado rechazado por el backend real.')
} finally {
  // Limpieza limitada a los UUID y correos desechables creados en esta ejecución local.
  for (const [id, address] of owned) {
    const result = await admin.auth.admin.getUserById(id)
    if (result.data.user?.email === address && /^auth-[0-9a-f-]+@example\.invalid$/.test(address)) {
      success(await admin.auth.admin.deleteUser(id))
    }
  }
  for (const id of messages) await fetch(`${mailbox}/api/v1/messages`, {
    method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({IDs: [id]}),
  })
  await Promise.all(clients.map(item => item.auth.dispose()))
}
