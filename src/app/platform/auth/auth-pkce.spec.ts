import {Router} from '@angular/router';
import {createClient} from '@supabase/supabase-js';
import {Database} from '@platform/supabase/database.types';
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {AuthService} from './auth.service';

describe('OAuth PKCE with the Supabase SDK', () => {
  it.each(['google', 'github'] as const)('exchanges %s once after restoration and validates the user', async provider => {
    const stored = new Map<string, string>()
    const requests: {path: string; body?: string}[] = []
    const user = {
      id: '11111111-1111-4111-8111-111111111111', email: 'person@example.com',
      aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-09-30T00:00:00Z',
    }
    const storageKey = `pkce-${provider}-test`
    const create = () => createClient<Database>('https://pkce.example', 'test-public-key', {
      db: {schema: 'nocendland'},
      auth: {
        flowType: 'pkce', detectSessionInUrl: false, storageKey, autoRefreshToken: false,
        storage: {
          getItem: key => stored.get(key) ?? null,
          setItem: (key, value) => { stored.set(key, value) },
          removeItem: key => { stored.delete(key) },
        },
      },
      global: {fetch: async (input, init) => {
        const url = new URL(input instanceof Request ? input.url : input.toString())
        requests.push({path: url.pathname, body: init?.body?.toString()})
        if (url.pathname === '/auth/v1/token') {
          expect(url.searchParams.get('grant_type')).toBe('pkce')
          return Response.json({access_token: 'test-token', refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user})
        }
        if (url.pathname === '/auth/v1/user') return Response.json(user)
        if (url.pathname === '/rest/v1/user') return Response.json([{...user, user_name: 'Test', avatar_url: null}])
        throw new Error(`Unexpected request: ${url.pathname}`)
      }},
    })
    const first = create()
    const {data, error} = await first.auth.signInWithOAuth({provider, options: {
      skipBrowserRedirect: true, redirectTo: `${location.origin}/auth/callback?returnUrl=%2F`,
    }})
    expect(error).toBeNull()
    expect(new URL(data.url!).searchParams.get('code_challenge')).toBeTruthy()
    expect(stored.get(`${storageKey}-code-verifier`)).toBeTruthy()
    await first.auth.dispose()
    history.replaceState({}, '', '/auth/callback?code=test-authorization-code')
    const restored = create()
    const auth = new AuthService({client: restored} as SupabaseClientService, {} as Router)
    try {
      await restored.auth.initialize()
      expect(requests).toHaveLength(0)
      await auth.exchangeCodeForSession('test-authorization-code')
      await expect(auth.isAuthenticated()).resolves.toBe(true)
      expect(auth.requireUserId()).toBe(user.id)
      const exchanges = requests.filter(request => request.path === '/auth/v1/token')
      expect(exchanges).toHaveLength(1)
      expect(JSON.parse(exchanges[0].body!).auth_code).toBe('test-authorization-code')
      expect(JSON.parse(exchanges[0].body!).code_verifier).toBeTruthy()
      expect(stored.has(`${storageKey}-code-verifier`)).toBe(false)
    } finally {
      auth.ngOnDestroy()
      await restored.auth.dispose()
      history.replaceState({}, '', '/')
    }
  })
})
