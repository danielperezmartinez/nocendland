import {Component} from '@angular/core'
import {TestBed} from '@angular/core/testing'
import {provideRouter, Router, RouterOutlet} from '@angular/router'
import {RouterTestingHarness} from '@angular/router/testing'
import {AuthChangeEvent, Session, User} from '@supabase/supabase-js'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {AppUser, AuthService} from './auth.service'
import {authGuard} from './auth.guard'

function authSubscription() {
  return {data: {subscription: {unsubscribe: vi.fn()}}}
}

const profile: AppUser = {
  id: '11111111-1111-4111-8111-111111111111', created_at: '2026-08-23T00:00:00Z',
  email: 'user@example.com', user_name: 'Nocendland User', avatar_url: 'https://example.com/avatar.png',
}
const remoteUser = {id: profile.id, email: profile.email, user_metadata: {}} as User

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(complete => { resolve = complete })
  return {promise, resolve}
}

function createBackend() {
  let listener!: (event: AuthChangeEvent, session: Session | null) => void
  const unsubscribe = vi.fn()
  const getUser = vi.fn().mockResolvedValue({data: {user: remoteUser}, error: null})
  const signOut = vi.fn().mockResolvedValue({error: null})
  const readProfile = vi.fn().mockResolvedValue({data: [profile], error: null})
  const upsert = vi.fn()
  const from = vi.fn().mockReturnValue({select: () => ({eq: () => ({limit: readProfile})}), upsert})
  const supabase = {client: {auth: {
    getUser, signOut,
    onAuthStateChange: vi.fn((callback: typeof listener) => {
      listener = callback
      return {data: {subscription: {unsubscribe}}}
    }),
  }, from}} as unknown as SupabaseClientService
  return {
    supabase, getUser, signOut, readProfile, upsert, from, unsubscribe,
    emit: (event: AuthChangeEvent, user: User | null) => listener(event, user ? {user} as Session : null),
  }
}

describe('AuthService navigation and profile reuse', () => {
  let backend: ReturnType<typeof createBackend>
  let service: AuthService
  let navigateByUrl: ReturnType<typeof vi.fn>

  beforeEach(() => {
    backend = createBackend()
    navigateByUrl = vi.fn().mockResolvedValue(true)
    service = new AuthService(backend.supabase, {navigateByUrl} as unknown as Router)
  })
  afterEach(() => service.ngOnDestroy())

  it('shares pending and resolved checks within one navigation', async () => {
    const response = deferred<{data: {user: User}; error: null}>()
    backend.getUser.mockReturnValue(response.promise)
    const first = service.isAuthenticated(1)
    const second = service.isAuthenticated(1)
    expect(backend.getUser).toHaveBeenCalledOnce()
    response.resolve({data: {user: remoteUser}, error: null})
    expect(await Promise.all([first, second])).toEqual([true, true])
    await expect(service.isAuthenticated(1)).resolves.toBe(true)
    expect(backend.getUser).toHaveBeenCalledOnce()
    expect(backend.readProfile).toHaveBeenCalledOnce()
  })

  it('validates each navigation remotely while reusing the same user profile', async () => {
    await service.isAuthenticated(1)
    await expect(service.isAuthenticated(2)).resolves.toBe(true)
    expect(backend.getUser).toHaveBeenCalledTimes(2)
    expect(backend.readProfile).toHaveBeenCalledOnce()
  })

  it('never reuses authentication outside a navigation', async () => {
    await service.isAuthenticated()
    await service.isAuthenticated()
    expect(backend.getUser).toHaveBeenCalledTimes(2)
    expect(backend.readProfile).toHaveBeenCalledOnce()
  })

  it.each(['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED'] as const)(
    'preserves the profile on %s for the same user without skipping remote validation', async event => {
      await service.isAuthenticated(1)
      backend.emit(event, remoteUser)
      await expect(service.isAuthenticated(2)).resolves.toBe(true)
      expect(backend.getUser).toHaveBeenCalledTimes(2)
      expect(backend.readProfile).toHaveBeenCalledOnce()
    },
  )

  it('reloads the profile when Auth reports updated user data', async () => {
    await service.isAuthenticated(1)
    backend.emit('USER_UPDATED', remoteUser)
    backend.readProfile.mockResolvedValue({data: [{...profile, user_name: 'Updated'}], error: null})
    await service.isAuthenticated(2)
    expect(backend.readProfile).toHaveBeenCalledTimes(2)
    expect(service.user()?.user_name).toBe('Updated')
  })

  it('clears cached checks and the profile after a sign-out event', async () => {
    await service.isAuthenticated(1)
    backend.emit('SIGNED_OUT', null)
    expect(service.user()).toBeUndefined()
    expect(() => service.requireUserId()).toThrow()
    backend.getUser.mockResolvedValue({data: {user: null}, error: null})
    await expect(service.isAuthenticated(1)).resolves.toBe(false)
    expect(backend.getUser).toHaveBeenCalledTimes(2)
  })

  it('reloads the profile when remote validation returns another user', async () => {
    await service.isAuthenticated(1)
    const otherProfile = {...profile, id: '22222222-2222-4222-8222-222222222222'}
    backend.getUser.mockResolvedValue({data: {user: {...remoteUser, id: otherProfile.id}}, error: null})
    backend.readProfile.mockResolvedValue({data: [otherProfile], error: null})
    await expect(service.isAuthenticated(2)).resolves.toBe(true)
    expect(service.user()).toEqual(otherProfile)
    expect(backend.readProfile).toHaveBeenCalledTimes(2)
  })

  it.each(['rejected', 'missing', 'exception'] as const)(
    'rejects a %s remote validation even with a cached profile', async failure => {
      await service.isAuthenticated(1)
      if (failure === 'exception') backend.getUser.mockRejectedValue(new Error('Network error'))
      else backend.getUser.mockResolvedValue({
        data: {user: failure === 'missing' ? null : remoteUser},
        error: failure === 'rejected' ? {message: 'Invalid token'} : null,
      })
      await expect(service.isAuthenticated(2)).resolves.toBe(false)
      expect(service.user()).toBeUndefined()
      expect(backend.getUser).toHaveBeenCalledTimes(2)
    },
  )

  it('does not restore a profile from a request pending at sign-out', async () => {
    const response = deferred<{data: AppUser[]; error: null}>()
    backend.readProfile.mockReturnValue(response.promise)
    const check = service.isAuthenticated(1)
    await vi.waitFor(() => expect(backend.readProfile).toHaveBeenCalledOnce())
    await service.signOut()
    response.resolve({data: [profile], error: null})
    await expect(check).resolves.toBe(false)
    expect(service.user()).toBeUndefined()
    expect(navigateByUrl).toHaveBeenCalledWith('/auth')
  })

  it('rejects remote responses from before a session change', async () => {
    const response = deferred<{data: {user: User}; error: null}>()
    backend.emit('INITIAL_SESSION', remoteUser)
    backend.getUser.mockReturnValueOnce(response.promise)
    const check = service.isAuthenticated(1)
    backend.emit('SIGNED_IN', {...remoteUser, id: 'another-user'})
    response.resolve({data: {user: remoteUser}, error: null})
    await expect(check).resolves.toBe(false)
    expect(backend.from).not.toHaveBeenCalled()
  })

  it('rejects a pending first validation if a new sign-in arrives before its response', async () => {
    const response = deferred<{data: {user: User}; error: null}>()
    backend.getUser.mockReturnValueOnce(response.promise)
    const check = service.isAuthenticated(1)
    backend.emit('SIGNED_IN', {...remoteUser, id: 'another-user'})
    response.resolve({data: {user: remoteUser}, error: null})
    await expect(check).resolves.toBe(false)
    expect(service.user()).toBeUndefined()
    expect(backend.from).not.toHaveBeenCalled()
  })

  it('does not let an older profile failure clear a newer authenticated user', async () => {
    const response = deferred<{data: null; error: {message: string}}>()
    backend.readProfile.mockReturnValueOnce(response.promise)
    const oldCheck = service.isAuthenticated(1)
    await vi.waitFor(() => expect(backend.readProfile).toHaveBeenCalledOnce())
    await expect(service.isAuthenticated(2)).resolves.toBe(true)
    response.resolve({data: null, error: {message: 'Late failure'}})
    await expect(oldCheck).resolves.toBe(false)
    expect(service.user()).toEqual(profile)
    expect(backend.signOut).not.toHaveBeenCalled()
  })

  it('does not create a missing profile after its session has ended', async () => {
    const response = deferred<{data: AppUser[]; error: null}>()
    backend.readProfile.mockReturnValue(response.promise)
    const check = service.isAuthenticated(1)
    await vi.waitFor(() => expect(backend.readProfile).toHaveBeenCalledOnce())
    backend.emit('SIGNED_OUT', null)
    response.resolve({data: [], error: null})
    await expect(check).resolves.toBe(false)
    expect(backend.upsert).not.toHaveBeenCalled()
  })

  it('blocks checks while an explicit sign-out is pending', async () => {
    await service.isAuthenticated(1)
    const response = deferred<{error: null}>()
    backend.signOut.mockReturnValue(response.promise)
    const logout = service.signOut()
    await expect(service.isAuthenticated(2)).resolves.toBe(false)
    expect(backend.getUser).toHaveBeenCalledOnce()
    expect(service.user()).toBeUndefined()
    response.resolve({error: null})
    await logout
  })

  it('unsubscribes from authentication events on destruction', () => {
    service.ngOnDestroy()
    expect(backend.unsubscribe).toHaveBeenCalledOnce()
  })

  it('requires fresh validation after a failed explicit sign-out', async () => {
    await service.isAuthenticated(1)
    backend.signOut.mockResolvedValue({error: new Error('Sign-out failed')})
    await expect(service.signOut()).rejects.toThrow('Sign-out failed')
    expect(service.user()).toBeUndefined()
    await expect(service.isAuthenticated(2)).resolves.toBe(true)
    expect(backend.getUser).toHaveBeenCalledTimes(2)
    expect(backend.readProfile).toHaveBeenCalledTimes(2)
  })
})

@Component({template: '<router-outlet/>', imports: [RouterOutlet]})
class ProtectedLayout {}
@Component({template: 'Protected page'})
class ProtectedPage {}
@Component({template: 'Public page'})
class PublicPage {}

describe('AuthService with nested route guards', () => {
  let backend: ReturnType<typeof createBackend>
  beforeEach(() => {
    backend = createBackend()
    TestBed.configureTestingModule({providers: [
      {provide: SupabaseClientService, useValue: backend.supabase},
      provideRouter([
        {path: 'auth', component: PublicPage},
        {path: 'public', component: PublicPage},
        {
          path: 'protected', component: ProtectedLayout,
          canActivate: [authGuard], canActivateChild: [authGuard],
          children: [{path: 'feature', component: ProtectedLayout, children: [
            {path: 'first', component: ProtectedPage},
            {path: 'second', component: ProtectedPage},
          ]}],
        },
      ]),
    ]})
  })

  it('validates once across nested guards and again on each following navigation', async () => {
    const harness = await RouterTestingHarness.create('/public')
    const checks = vi.spyOn(TestBed.inject(AuthService), 'isAuthenticated')
    await harness.navigateByUrl('/protected/feature/first')
    expect(harness.routeNativeElement?.textContent).toContain('Protected page')
    expect(checks.mock.calls.length).toBeGreaterThan(1)
    expect(backend.getUser).toHaveBeenCalledOnce()
    expect(backend.readProfile).toHaveBeenCalledOnce()
    await harness.navigateByUrl('/protected/feature/second')
    expect(backend.getUser).toHaveBeenCalledTimes(2)
    expect(backend.readProfile).toHaveBeenCalledOnce()
    backend.getUser.mockResolvedValue({data: {user: null}, error: {message: 'Session expired'}})
    await harness.navigateByUrl('/protected/feature/first')
    expect(backend.getUser).toHaveBeenCalledTimes(3)
    expect(TestBed.inject(Router).url).toContain('/auth?returnUrl=')
    expect(harness.routeNativeElement?.textContent).not.toContain('Protected page')
  })

  it('revalidates when returning to the same URL after leaving the protected area', async () => {
    const harness = await RouterTestingHarness.create('/protected/feature/first')
    await harness.navigateByUrl('/public')
    await harness.navigateByUrl('/protected/feature/first')
    expect(backend.getUser).toHaveBeenCalledTimes(2)
    expect(backend.readProfile).toHaveBeenCalledOnce()
  })

  it('rejects an anonymous deep link before showing the protected page', async () => {
    backend.getUser.mockResolvedValue({data: {user: null}, error: null})
    const harness = await RouterTestingHarness.create('/protected/feature/first')
    expect(TestBed.inject(Router).url).toContain('/auth?returnUrl=')
    expect(harness.routeNativeElement?.textContent).not.toContain('Protected page')
    expect(backend.from).not.toHaveBeenCalled()
  })

  it('revalidates after cancellation and ignores the cancelled remote response', async () => {
    const harness = await RouterTestingHarness.create('/public')
    const router = TestBed.inject(Router)
    const response = deferred<{data: {user: User}; error: null}>()
    backend.getUser.mockReturnValueOnce(response.promise)
    const cancelled = router.navigateByUrl('/protected/feature/first')
    await vi.waitFor(() => expect(backend.getUser).toHaveBeenCalledOnce())
    await harness.navigateByUrl('/protected/feature/second')
    response.resolve({data: {user: {...remoteUser, id: 'old-user'}}, error: null})
    await expect(cancelled).resolves.toBe(false)
    expect(router.url).toBe('/protected/feature/second')
    expect(backend.getUser).toHaveBeenCalledTimes(2)
    expect(backend.readProfile).toHaveBeenCalledOnce()
    expect(TestBed.inject(AuthService).user()).toEqual(profile)
  })
})

describe('AuthService return paths', () => {
  const service = new AuthService({client: {auth: {onAuthStateChange: authSubscription}}} as unknown as SupabaseClientService, {} as Router)

  it('preserves internal training share links', () => {
    expect(service.sanitizeReturnPath('/share/training/token?source=test#preview'))
      .toBe('/share/training/token?source=test#preview')
  })

  it('rejects external and authentication return paths', () => {
    expect(service.sanitizeReturnPath('https://attacker.example/share')).toBe('/')
    expect(service.sanitizeReturnPath('//attacker.example/share')).toBe('/')
    expect(service.sanitizeReturnPath('/auth/callback')).toBe('/')
  })
})

describe('AuthService profiles', () => {
  it('creates the Nocendland profile for an authenticated user when it is missing', async () => {
    const createdProfile = {
      id: '11111111-1111-4111-8111-111111111111',
      created_at: '2026-08-23T00:00:00Z',
      email: 'user@example.com',
      user_name: 'Nocendland User',
      avatar_url: 'https://example.com/avatar.png',
    }
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({data: createdProfile, error: null}),
      }),
    })
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({data: [], error: null}),
        }),
      }),
      upsert,
    })
    const supabase = {
      client: {
        auth: {
          onAuthStateChange: authSubscription,
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: createdProfile.id,
                email: createdProfile.email,
                user_metadata: {
                  name: createdProfile.user_name,
                  avatar_url: createdProfile.avatar_url,
                },
              },
            },
            error: null,
          }),
        },
        from,
      },
    }
    const service = new AuthService(supabase as unknown as SupabaseClientService, {} as Router)

    await expect(service.isAuthenticated()).resolves.toBe(true)
    expect(upsert).toHaveBeenCalledWith({
      id: createdProfile.id,
      email: createdProfile.email,
      user_name: createdProfile.user_name,
      avatar_url: createdProfile.avatar_url,
    }, {onConflict: 'id'})
    expect(service.user()).toEqual(createdProfile)
  })

  it('clears only the local session when the authenticated profile cannot be recovered', async () => {
    const signOut = vi.fn().mockResolvedValue({error: null})
    const supabase = {
      client: {
        auth: {
          onAuthStateChange: authSubscription,
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: '11111111-1111-4111-8111-111111111111',
                email: 'user@example.com',
                user_metadata: {},
              },
            },
            error: null,
          }),
          signOut,
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: {code: 'PGRST116', message: 'Profile is not accessible'},
              }),
            }),
          }),
        }),
      },
    }
    const service = new AuthService(supabase as unknown as SupabaseClientService, {} as Router)

    await expect(service.isAuthenticated()).resolves.toBe(false)
    expect(signOut).toHaveBeenCalledWith({scope: 'local'})
    expect(service.user()).toBeUndefined()
  })
})
