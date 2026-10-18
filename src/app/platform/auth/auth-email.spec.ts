import {Router} from '@angular/router';
import {AuthChangeEvent, Session, User} from '@supabase/supabase-js';
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {AuthService} from './auth.service';

describe('AuthService email flows', () => {
  const user = {id: 'email-user', email: 'person@example.com', user_metadata: {}} as User
  let listener: (event: AuthChangeEvent, session: Session | null) => void
  let service: AuthService
  let auth: Record<string, ReturnType<typeof vi.fn>>

  beforeEach(() => {
    sessionStorage.clear()
    auth = Object.fromEntries(['signUp', 'signInWithPassword', 'signInWithOtp', 'verifyOtp', 'resend',
      'resetPasswordForEmail', 'updateUser', 'getUser', 'exchangeCodeForSession', 'signOut'].map(name =>
      [name, vi.fn().mockResolvedValue({data: {user, session: {user}}, error: null})]))
    auth['onAuthStateChange'] = vi.fn(callback => {
      listener = callback
      callback('INITIAL_SESSION', null)
      return {data: {subscription: {unsubscribe: vi.fn()}}}
    })
    service = new AuthService({client: {auth}} as unknown as SupabaseClientService, {} as Router)
    vi.spyOn(service, 'emailAuthEnabled', 'get').mockReturnValue(true)
  })

  afterEach(() => { service.ngOnDestroy(); sessionStorage.clear() })

  it('does not authorize or create a profile when requesting a code', async () => {
    await service.sendEmailCode(' person@example.com ', false)
    expect(auth['signInWithOtp']).toHaveBeenCalledWith({email: user.email, options: {shouldCreateUser: false}})
    expect(auth['getUser']).not.toHaveBeenCalled()
    expect(service.user()).toBeUndefined()
    await service.sendEmailCode(user.email!, true)
    expect(auth['signInWithOtp']).toHaveBeenLastCalledWith({email: user.email, options: {shouldCreateUser: true}})
  })

  it('uses native registration, password access and confirmation resend', async () => {
    await service.signUpWithPassword(user.email!, 'password-test')
    await service.signInWithPassword(user.email!, 'password-test')
    await service.resendConfirmation(user.email!)
    expect(auth['signUp']).toHaveBeenCalledWith({email: user.email, password: 'password-test'})
    expect(auth['signInWithPassword']).toHaveBeenCalledWith({email: user.email, password: 'password-test'})
    expect(auth['resend']).toHaveBeenCalledWith({email: user.email, type: 'signup'})
  })

  it('verifies email codes without confusing them with password recovery', async () => {
    await service.verifyEmailCode(user.email!, '123456')
    expect(auth['verifyOtp']).toHaveBeenCalledWith({email: user.email, token: '123456', type: 'email'})
    expect(service.recoveryUserId()).toBeNull()
  })

  it('blocks protected access during recovery until the password is updated', async () => {
    await service.requestPasswordReset(user.email!)
    await service.verifyEmailCode(user.email!, '123456', true)
    expect(auth['verifyOtp']).toHaveBeenCalledWith({email: user.email, token: '123456', type: 'recovery'})
    await expect(service.isAuthenticated()).resolves.toBe(false)
    expect(auth['getUser']).not.toHaveBeenCalled()
    await service.resetPassword('replacement-password')
    expect(auth['updateUser']).toHaveBeenCalledWith({password: 'replacement-password'})
    expect(service.recoveryUserId()).toBeNull()
  })

  it('preserves recovery across refresh and clears it on sign-out', async () => {
    listener('PASSWORD_RECOVERY', {user} as Session)
    auth['onAuthStateChange'].mockImplementation(callback => {
      listener = callback
      callback('INITIAL_SESSION', {user})
      return {data: {subscription: {unsubscribe: vi.fn()}}}
    })
    const restored = new AuthService({client: {auth}} as unknown as SupabaseClientService, {} as Router)
    expect(restored.recoveryUserId()).toBe(user.id)
    listener('SIGNED_OUT', null)
    expect(restored.recoveryUserId()).toBeNull()
    restored.ngOnDestroy()
  })

  it('clears a saved recovery flow when restoration finds no session', async () => {
    listener('PASSWORD_RECOVERY', {user} as Session)
    listener('INITIAL_SESSION', null)
    expect(service.recoveryUserId()).toBeNull()
  })

  it('does not depend on sessionStorage being writable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('Storage blocked') })
    expect(() => listener('PASSWORD_RECOVERY', {user} as Session)).not.toThrow()
    expect(service.recoveryUserId()).toBe(user.id)
  })

  it('does not change the password without verified recovery or for a different account', async () => {
    await expect(service.resetPassword('replacement')).rejects.toThrow('Verifica')
    await service.verifyEmailCode(user.email!, '123456', true)
    auth['getUser'].mockResolvedValue({data: {user: {...user, id: 'other'}}, error: null})
    await expect(service.resetPassword('replacement')).rejects.toThrow('Verifica')
    expect(auth['updateUser']).not.toHaveBeenCalled()
  })

  it('retains recovery when changing the password fails so the user can retry', async () => {
    await service.verifyEmailCode(user.email!, '123456', true)
    auth['updateUser'].mockResolvedValueOnce({error: new Error('Network failure')})
    await expect(service.resetPassword('replacement')).rejects.toThrow()
    expect(service.recoveryUserId()).toBe(user.id)
  })

  it.each(['otp_expired', 'over_email_send_rate_limit'])('propagates %s without authorizing access', async code => {
    auth['verifyOtp'].mockResolvedValue({data: {session: null, user: null}, error: {code}})
    await expect(service.verifyEmailCode(user.email!, '000000', true)).rejects.toEqual({code})
    expect(service.recoveryUserId()).toBeNull()
    expect(service.user()).toBeUndefined()
  })

  it('blocks all email operations when disabled, including direct service calls', async () => {
    vi.spyOn(service, 'emailAuthEnabled', 'get').mockReturnValue(false)
    const operations = [
      () => service.signUpWithPassword('x@example.com', 'password'),
      () => service.signInWithPassword('x@example.com', 'password'),
      () => service.sendEmailCode('x@example.com', true),
      () => service.resendConfirmation('x@example.com'),
      () => service.verifyEmailCode('x@example.com', '123456'),
      () => service.requestPasswordReset('x@example.com'),
      () => service.resetPassword('password'),
    ]
    for (const operation of operations) await expect(operation()).rejects.toThrow('no está disponible')
    expect(auth['signUp']).not.toHaveBeenCalled()
    expect(auth['verifyOtp']).not.toHaveBeenCalled()
    expect(auth['updateUser']).not.toHaveBeenCalled()
  })

  it('surfaces a rejected PKCE exchange instead of using an unrelated saved session', async () => {
    auth['exchangeCodeForSession'].mockResolvedValue({error: new Error('Invalid code')})
    await expect(service.exchangeCodeForSession('used-code')).rejects.toThrow('Invalid code')
  })
})
