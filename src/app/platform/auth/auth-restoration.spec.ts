import {Router} from '@angular/router'
import {createClient} from '@supabase/supabase-js'
import {Database} from '@platform/supabase/database.types'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {AuthService} from './auth.service'

describe('AuthService persisted session restoration with the Supabase SDK', () => {
  const user = {
    id: '11111111-1111-4111-8111-111111111111', email: 'user@example.com',
    aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {},
    created_at: '2026-08-23T00:00:00Z',
  }
  const profile = {...user, user_name: 'Test User', avatar_url: null}
  const storageKey = 'auth-restoration-test'
  let saved: Map<string, string>
  let requests: string[]
  let rejectUser: boolean
  const clients: ReturnType<typeof createClient<Database>>[] = []
  const services: AuthService[] = []

  function session(expired = false) {
    const expiresAt = Math.floor(Date.now() / 1000) + (expired ? -60 : 3600)
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    return {
      access_token: `${encode({alg: 'HS256', typ: 'JWT'})}.${encode({sub: user.id, exp: expiresAt})}.dGVzdA`,
      refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, user,
    }
  }

  function openApp() {
    const client = createClient<Database>('https://auth-restoration.example', 'test-public-key', {
      db: {schema: 'nocendland'},
      auth: {
        storageKey, detectSessionInUrl: false,
        storage: {
          getItem: (key: string) => saved.get(key) ?? null,
          setItem: (key: string, value: string) => { saved.set(key, value) },
          removeItem: (key: string) => { saved.delete(key) },
        },
      },
      global: {fetch: async input => {
        const url = new URL(input instanceof Request ? input.url : input.toString())
        requests.push(url.pathname)
        if (url.pathname === '/auth/v1/user') {
          return rejectUser
            ? Response.json({message: 'Invalid token', code: 'bad_jwt'}, {status: 401})
            : Response.json(user)
        }
        if (url.pathname === '/auth/v1/token') return Response.json(session())
        if (url.pathname === '/rest/v1/user') return Response.json([profile])
        throw new Error(`Unexpected request: ${url.pathname}`)
      }},
    })
    clients.push(client)
    const service = new AuthService({client} as SupabaseClientService, {} as Router)
    services.push(service)
    return {client, service}
  }

  beforeEach(() => {
    saved = new Map([[storageKey, JSON.stringify(session())]])
    requests = []
    rejectUser = false
  })

  afterEach(async () => {
    services.splice(0).forEach(service => service.ngOnDestroy())
    await Promise.all(clients.splice(0).map(client => client.auth.dispose()))
  })

  it('restores a saved session on consecutive cold starts without another login', async () => {
    for (let opening = 0; opening < 2; opening += 1) {
      const {client, service} = openApp()
      await expect(service.isAuthenticated(1)).resolves.toBe(true)
      await expect(service.isAuthenticated(1)).resolves.toBe(true)
      expect(service.requireUserId()).toBe(user.id)
      await expect(service.isAuthenticated(2)).resolves.toBe(true)
      service.ngOnDestroy()
      await client.auth.dispose()
      expect(saved.has(storageKey)).toBe(true)
    }
    expect(requests.filter(path => path === '/auth/v1/user')).toHaveLength(4)
    expect(requests.filter(path => path === '/rest/v1/user')).toHaveLength(2)
  })

  it('refreshes an expired access token using the persisted refresh token', async () => {
    saved.set(storageKey, JSON.stringify(session(true)))
    const {service} = openApp()
    await expect(service.isAuthenticated(1)).resolves.toBe(true)
    expect(service.requireUserId()).toBe(user.id)
    expect(requests).toContain('/auth/v1/token')
    expect(requests.filter(path => path === '/auth/v1/user')).toHaveLength(1)
    expect(saved.has(storageKey)).toBe(true)
  })

  it('still rejects a stored session when remote validation rejects its user', async () => {
    rejectUser = true
    const {service} = openApp()
    await expect(service.isAuthenticated(1)).resolves.toBe(false)
    expect(service.user()).toBeUndefined()
    expect(requests).toContain('/auth/v1/user')
    expect(requests).not.toContain('/rest/v1/user')
  })

  it('rejects a cold start without a saved session', async () => {
    saved.clear()
    const {service} = openApp()
    await expect(service.isAuthenticated(1)).resolves.toBe(false)
    expect(service.user()).toBeUndefined()
    expect(requests).not.toContain('/rest/v1/user')
  })
})
