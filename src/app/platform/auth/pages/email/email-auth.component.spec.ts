import {Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {AuthService} from '../../auth.service';
import {AUTH_ROUTES} from '../../auth.routes';

@Component({template: 'Your atlas'})
class HomePage {}

describe('Email authentication pages', () => {
  let auth: ReturnType<typeof createAuth>
  let harness: RouterTestingHarness

  function createAuth() {
    return {
      emailAuthEnabled: true,
      recoveryUserId: signal<string | null>(null),
      hasPasswordRecovery: async () => !!auth.recoveryUserId(),
      user: signal(undefined),
      sanitizeReturnPath: (path: string | null) => path?.startsWith('/') && !path.startsWith('//') ? path : '/',
      signUpWithPassword: vi.fn().mockResolvedValue(undefined),
      signInWithPassword: vi.fn().mockResolvedValue(undefined),
      sendEmailCode: vi.fn().mockResolvedValue(undefined),
      verifyEmailCode: vi.fn().mockResolvedValue(undefined),
      resendConfirmation: vi.fn().mockResolvedValue(undefined),
      requestPasswordReset: vi.fn().mockResolvedValue(undefined),
      resetPassword: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: vi.fn().mockResolvedValue(true),
      signOut: vi.fn().mockResolvedValue(undefined),
    }
  }

  beforeEach(async () => {
    history.replaceState({}, '')
    auth = createAuth()
    TestBed.configureTestingModule({providers: [
      {provide: AuthService, useValue: auth},
      provideRouter([{path: 'auth', children: AUTH_ROUTES}, {path: '', component: HomePage}]),
    ]})
    harness = await RouterTestingHarness.create()
  })

  function input(id: string, value: string) {
    const element = harness.routeNativeElement!.querySelector<HTMLInputElement>(`#${id}`)!
    element.value = value
    element.dispatchEvent(new Event('input'))
    harness.detectChanges()
  }

  async function submit() {
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new Event('submit', {cancelable: true}))
    await harness.fixture.whenStable()
    harness.detectChanges()
  }

  it('registers then verifies a confirmation code before entering the app', async () => {
    await harness.navigateByUrl('/auth/register')
    input('email', 'person@example.com'); input('password', 'long-password'); input('confirmation', 'long-password')
    await submit()
    expect(auth.signUpWithPassword).toHaveBeenCalledWith('person@example.com', 'long-password')
    expect(TestBed.inject(Router).url).toContain('/auth/verify')
    expect(auth.isAuthenticated).not.toHaveBeenCalled()
    input('token', '123456')
    await submit()
    expect(auth.verifyEmailCode).toHaveBeenCalledWith('person@example.com', '123456', false)
    expect(TestBed.inject(Router).url).toBe('/')
  })

  it('rejects mismatching passwords without calling Supabase', async () => {
    await harness.navigateByUrl('/auth/register')
    input('email', 'person@example.com'); input('password', 'long-password'); input('confirmation', 'different')
    await submit()
    expect(auth.signUpWithPassword).not.toHaveBeenCalled()
    expect(harness.routeNativeElement!.textContent).toContain('no coinciden')
  })

  it('uses code login without creating an account and waits before allowing resend', async () => {
    await harness.navigateByUrl('/auth/email')
    const buttons = Array.from(harness.routeNativeElement!.querySelectorAll('button'))
    buttons.find(button => button.textContent?.includes('Usar un código'))!.click()
    harness.detectChanges()
    input('email', 'person@example.com')
    await submit()
    expect(auth.sendEmailCode).toHaveBeenCalledWith('person@example.com', false)
    const resend = Array.from(harness.routeNativeElement!.querySelectorAll('button')).find(button => button.textContent?.includes('Reenviar'))!
    expect(resend.disabled).toBe(true)
  })

  it('keeps expired code errors in the form without entering the app', async () => {
    auth.verifyEmailCode.mockRejectedValue({code: 'otp_expired'})
    await harness.navigateByUrl('/auth/verify')
    input('token', '123456')
    await submit()
    expect(harness.routeNativeElement!.querySelector('[role="alert"]')?.textContent).toContain('caducado')
    expect(auth.isAuthenticated).not.toHaveBeenCalled()
  })

  it('blocks reset-password without verified recovery', async () => {
    await harness.navigateByUrl('/auth/reset-password')
    expect(TestBed.inject(Router).url).toBe('/auth/recover')
  })

  it('offers confirmation resend after an unconfirmed password login', async () => {
    auth.signInWithPassword.mockRejectedValue({code: 'email_not_confirmed'})
    await harness.navigateByUrl('/auth/email')
    input('email', 'person@example.com'); input('password', 'long-password'); await submit()
    const resend = Array.from(harness.routeNativeElement!.querySelectorAll('button')).find(button => button.textContent?.includes('Reenviar confirmación'))!
    resend.click()
    await harness.fixture.whenStable()
    expect(auth.resendConfirmation).toHaveBeenCalledWith('person@example.com')
    expect(TestBed.inject(Router).url).toContain('/auth/verify')
  })

  it('recovers with a code and requires a new password before entering', async () => {
    auth.verifyEmailCode.mockImplementation(async () => { auth.recoveryUserId.set('user') })
    auth.resetPassword.mockImplementation(async () => { auth.recoveryUserId.set(null) })
    await harness.navigateByUrl('/auth/recover')
    input('email', 'person@example.com'); await submit()
    input('token', '123456'); await submit()
    expect(auth.verifyEmailCode).toHaveBeenCalledWith('person@example.com', '123456', true)
    expect(TestBed.inject(Router).url).toContain('/auth/reset-password')
    expect(auth.isAuthenticated).not.toHaveBeenCalled()
    input('password', 'new-password'); input('confirmation', 'new-password'); await submit()
    expect(auth.resetPassword).toHaveBeenCalledWith('new-password')
    expect(TestBed.inject(Router).url).toBe('/')
  })

  it('hides email options and blocks all direct routes when disabled', async () => {
    auth.emailAuthEnabled = false
    for (const path of ['email', 'register', 'verify', 'recover', 'reset-password']) {
      await harness.navigateByUrl(`/auth/${path}`)
      expect(TestBed.inject(Router).url).toBe('/auth')
      expect(harness.routeNativeElement!.textContent).not.toContain('Continuar con correo')
      expect(harness.routeNativeElement!.textContent).toContain('Continuar con Google')
    }
  })
})
