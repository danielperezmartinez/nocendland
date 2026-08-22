import {Component} from '@angular/core'
import {TestBed} from '@angular/core/testing'
import {provideRouter, Router, Routes} from '@angular/router'
import {RouterTestingHarness} from '@angular/router/testing'

import {AuthService} from './auth.service'
import {authGuard} from './auth.guard'

@Component({selector: 'app-auth-test', template: 'Auth'})
class AuthTestComponent {}

@Component({selector: 'app-public-test', template: 'Public'})
class PublicTestComponent {}

@Component({selector: 'app-protected-test', template: 'Protected'})
class ProtectedTestComponent {
  constructor() {
    protectedComponentCreations += 1
  }
}

const testRoutes: Routes = [
  {path: 'auth', component: AuthTestComponent},
  {path: 'public', component: PublicTestComponent},
  {path: 'protected', component: ProtectedTestComponent, canActivate: [authGuard]},
]

let protectedComponentCreations = 0

describe('authGuard', () => {
  let router: Router
  let isAuthenticated: ReturnType<typeof vi.fn>
  let sanitizeReturnPath: ReturnType<typeof vi.fn>

  beforeEach(() => {
    protectedComponentCreations = 0
    isAuthenticated = vi.fn()
    sanitizeReturnPath = vi.fn((path: string) => path)

    TestBed.configureTestingModule({
      providers: [
        provideRouter(testRoutes),
        {
          provide: AuthService,
          useValue: {isAuthenticated, sanitizeReturnPath},
        },
      ],
    })

    router = TestBed.inject(Router)
  })

  it('allows an authenticated session to activate the requested route', async () => {
    isAuthenticated.mockResolvedValue(true)
    const harness = await RouterTestingHarness.create('/public')

    await harness.navigateByUrl('/protected', ProtectedTestComponent)

    expect(router.url).toBe('/protected')
    expect(protectedComponentCreations).toBe(1)
  })

  it('does not activate the protected route for an anonymous user', async () => {
    isAuthenticated.mockResolvedValue(false)
    const harness = await RouterTestingHarness.create('/public')

    await harness.navigateByUrl('/protected')

    expect(protectedComponentCreations).toBe(0)
  })

  it('redirects an anonymous user to auth with the requested return URL', async () => {
    isAuthenticated.mockResolvedValue(false)
    const harness = await RouterTestingHarness.create('/public')

    await harness.navigateByUrl('/protected?source=test#details')

    expect(sanitizeReturnPath).toHaveBeenCalledWith('/protected?source=test#details')
    expect(router.url).toBe('/auth?returnUrl=%2Fprotected%3Fsource%3Dtest%23details')
    expect(harness.routeNativeElement?.textContent).toContain('Auth')
  })

  it('keeps the current route active while authentication is unresolved', async () => {
    let resolveAuthentication!: (authenticated: boolean) => void
    isAuthenticated.mockImplementation(() => new Promise<boolean>((resolve) => {
      resolveAuthentication = resolve
    }))
    const harness = await RouterTestingHarness.create('/public')

    const navigation = harness.navigateByUrl('/protected', ProtectedTestComponent)
    await vi.waitFor(() => expect(isAuthenticated).toHaveBeenCalledOnce())

    expect(router.url).toBe('/public')
    expect(protectedComponentCreations).toBe(0)

    resolveAuthentication(true)
    await navigation

    expect(router.url).toBe('/protected')
    expect(protectedComponentCreations).toBe(1)
  })
})
