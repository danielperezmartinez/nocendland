import {Injectable, OnDestroy, signal} from '@angular/core';
import {Router} from '@angular/router';
import {OAuthResponse, Subscription, User} from '@supabase/supabase-js';
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {Database} from '@platform/supabase/database.types';
import {environment} from '@environments/environment';

export type AuthProvider = 'github' | 'google'
export type AppUser = Database['nocendland']['Tables']['user']['Row']

@Injectable({providedIn: 'root'})
export class AuthService implements OnDestroy {
  private readonly recoveryStorageKey = `nocendland-recovery:${environment.supabaseUrl}`
  private readonly recoveryState = signal<string | null>(this.readRecoveryUser())
  readonly recoveryUserId = this.recoveryState.asReadonly()
  get emailAuthEnabled(): boolean { return environment.emailAuthEnabled }
  private readonly userState = signal<AppUser | undefined>(undefined)
  private readonly authSubscription: Subscription
  private initialSessionLoaded = false
  private resolveInitialSession!: () => void
  private readonly initialSessionReady = new Promise<void>(resolve => {
    this.resolveInitialSession = resolve
  })
  private sessionUserId: string | undefined
  private sessionVersion = 0
  private validationId = 0
  private signingOut = false
  private navigationCheck: {id: number; result: Promise<boolean>} | undefined

  readonly user = this.userState.asReadonly()

  constructor(
    private readonly supabase: SupabaseClientService,
    private readonly router: Router,
  ) {
    this.authSubscription = this.supabase.client.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user.id
      if (event === 'PASSWORD_RECOVERY' && nextUserId) this.setRecoveryUser(nextUserId)
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !nextUserId)
        || (nextUserId && this.recoveryState() !== nextUserId)) {
        this.setRecoveryUser(null)
      }
      // Este callback es síncrono: no llama a Supabase mientras Auth mantiene su bloqueo.
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED'
        || (this.initialSessionLoaded && event === 'SIGNED_IN' && nextUserId !== this.sessionUserId)
        || (this.sessionUserId !== undefined && this.sessionUserId !== nextUserId)) {
        this.invalidateSession()
      }
      this.sessionUserId = nextUserId
      if (event === 'INITIAL_SESSION') {
        this.initialSessionLoaded = true
        this.resolveInitialSession()
      }
    }).data.subscription
  }

  public ngOnDestroy(): void {
    this.authSubscription.unsubscribe()
    this.invalidateSession()
    this.resolveInitialSession()
  }

  public isAuthenticated(navigationId?: number): Promise<boolean> {
    if (this.recoveryState()) {
      return this.initialSessionReady.then(() => this.recoveryState() ? false : this.isAuthenticated(navigationId))
    }
    if (this.signingOut) return Promise.resolve(false)
    if (navigationId !== undefined && this.navigationCheck?.id === navigationId) {
      return this.navigationCheck.result
    }

    // Se conserva también el resultado resuelto: los guards anidados se ejecutan en serie.
    // Una navegación diferente siempre inicia una nueva validación remota.
    const result = this.validateUser()
    this.navigationCheck = navigationId === undefined ? undefined : {id: navigationId, result}
    return result
  }

  private async validateUser(): Promise<boolean> {
    const validationId = ++this.validationId
    const sessionVersion = this.sessionVersion
    const isCurrent = () => validationId === this.validationId && sessionVersion === this.sessionVersion

    try {
      // Supabase también emite SIGNED_IN al recuperar la sesión persistida.
      // Esperamos su estado inicial antes de validar; la restauración no es un cambio de cuenta.
      await this.initialSessionReady
      if (!isCurrent()) return false
      const {data, error} = await this.supabase.client.auth.getUser()
      if (!isCurrent()) return false
      if (error || !data.user) {
        this.invalidateSession()
        return false
      }

      this.sessionUserId = data.user.id
      if (this.userState()?.id === data.user.id) return true
      this.userState.set(undefined)

      try {
        const profile = await this.loadUserProfile(data.user, isCurrent)
        if (!isCurrent() || !profile) return false
        this.userState.set(profile)
      } catch {
        // Una respuesta antigua nunca debe cerrar una sesión más reciente.
        if (isCurrent()) await this.clearLocalSession()
        return false
      }
      return true
    } catch {
      if (isCurrent()) this.invalidateSession()
      return false
    }
  }

  public async exchangeCodeForSession(code: string): Promise<void> {
    await this.initialSessionReady
    const {error} = await this.supabase.client.auth.exchangeCodeForSession(code)
    if (error) throw error
  }

  public async signInWithPassword(email: string, password: string): Promise<void> {
    this.requireEmailAuth()
    const {error} = await this.supabase.client.auth.signInWithPassword({email: email.trim(), password})
    if (error) throw error
  }

  public async signUpWithPassword(email: string, password: string): Promise<void> {
    this.requireEmailAuth()
    const {error} = await this.supabase.client.auth.signUp({email: email.trim(), password})
    if (error) throw error
  }

  public async sendEmailCode(email: string, createAccount: boolean): Promise<void> {
    this.requireEmailAuth()
    const {error} = await this.supabase.client.auth.signInWithOtp({
      email: email.trim(), options: {shouldCreateUser: createAccount},
    })
    if (error) throw error
  }

  public async resendConfirmation(email: string): Promise<void> {
    this.requireEmailAuth()
    const {error} = await this.supabase.client.auth.resend({type: 'signup', email: email.trim()})
    if (error) throw error
  }

  public async verifyEmailCode(email: string, token: string, recovery = false): Promise<void> {
    this.requireEmailAuth()
    const {data, error} = await this.supabase.client.auth.verifyOtp({
      email: email.trim(), token: token.trim(), type: recovery ? 'recovery' : 'email',
    })
    if (error) throw error
    if (!data.session || !data.user) throw new Error('No se pudo verificar la sesión. Solicita otro código.')
    if (recovery) this.setRecoveryUser(data.user.id)
  }

  public async requestPasswordReset(email: string): Promise<void> {
    this.requireEmailAuth()
    const {error} = await this.supabase.client.auth.resetPasswordForEmail(email.trim())
    if (error) throw error
  }

  public async resetPassword(password: string): Promise<void> {
    this.requireEmailAuth()
    const recoveryUserId = this.recoveryState()
    const sessionVersion = this.sessionVersion
    const {data, error} = await this.supabase.client.auth.getUser()
    if (this.sessionVersion !== sessionVersion || this.recoveryState() !== recoveryUserId) {
      throw new Error('La sesión ha cambiado. Vuelve a verificar tu acceso.')
    }
    if (error || !recoveryUserId || data.user?.id !== recoveryUserId) {
      this.setRecoveryUser(null)
      throw new Error('Verifica el código de recuperación antes de cambiar la contraseña.')
    }
    const {error: updateError} = await this.supabase.client.auth.updateUser({password})
    if (updateError) throw updateError
    this.setRecoveryUser(null)
  }

  public async hasPasswordRecovery(): Promise<boolean> {
    await this.initialSessionReady
    return this.emailAuthEnabled && !!this.recoveryState()
  }

  private requireEmailAuth(): void {
    if (!this.emailAuthEnabled) throw new Error('El acceso por correo todavía no está disponible.')
  }

  private setRecoveryUser(userId: string | null): void {
    this.recoveryState.set(userId)
    try {
      if (userId) sessionStorage.setItem(this.recoveryStorageKey, userId)
      else sessionStorage.removeItem(this.recoveryStorageKey)
    } catch {
      // Si el navegador bloquea almacenamiento, el flujo sigue disponible en memoria.
    }
  }

  private readRecoveryUser(): string | null {
    try { return sessionStorage.getItem(this.recoveryStorageKey) }
    catch { return null }
  }

  public signInWithGithub(returnPath = '/'): Promise<OAuthResponse> {
    return this.signInWithOAuth('github', returnPath)
  }

  public signInWithGoogle(returnPath = '/'): Promise<OAuthResponse> {
    return this.signInWithOAuth('google', returnPath)
  }

  public async signOut(): Promise<void> {
    this.signingOut = true
    this.invalidateSession()
    try {
      // Auth se comparte con otras aplicaciones: cerrar Nocendland no debe revocar sus sesiones.
      const {error} = await this.supabase.client.auth.signOut({scope: 'local'})
      if (error) throw error
      await this.router.navigateByUrl('/auth')
    } finally {
      this.signingOut = false
    }
  }

  public requireUserId(): string {
    const userId = this.userState()?.id
    if (!userId) throw new Error('No authenticated user is available')
    return userId
  }

  public sanitizeReturnPath(returnPath: string | null | undefined): string {
    if (!returnPath?.startsWith('/') || returnPath.startsWith('//')) return '/'
    try {
      const url = new URL(returnPath, globalThis.location.origin)
      if (url.origin !== globalThis.location.origin || url.pathname.startsWith('/auth')) return '/'
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return '/'
    }
  }

  private signInWithOAuth(provider: AuthProvider, returnPath: string): Promise<OAuthResponse> {
    return this.supabase.client.auth.signInWithOAuth({
      provider,
      options: {redirectTo: this.authRedirectUrl(returnPath)},
    })
  }

  private async loadUserProfile(authUser: User, isCurrent: () => boolean): Promise<AppUser | undefined> {
    const {data: profiles, error} = await this.supabase.client
      .from('user')
      .select('*')
      .eq('id', authUser.id)
      .limit(1)

    if (!isCurrent()) return undefined
    if (error) throw error
    const profile = profiles?.[0]
    if (profile) {
      return profile
    }

    if (!authUser.email) throw new Error('The authenticated user has no email')

    const metadata = authUser.user_metadata
    const {data: createdProfile, error: creationError} = await this.supabase.client
      .from('user')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        user_name: metadata['user_name'] ?? metadata['name'] ?? authUser.email.split('@')[0],
        avatar_url: metadata['avatar_url'] ??
          'https://e7.pngegg.com/pngimages/643/454/png-clipart-business-game-avatar-computer-program-google-smart-object-game-child-thumbnail.png',
      }, {onConflict: 'id'})
      .select('*')
      .single()

    if (creationError) throw creationError
    return createdProfile
  }

  private invalidateSession(): void {
    this.sessionVersion += 1
    this.navigationCheck = undefined
    this.userState.set(undefined)
  }

  private async clearLocalSession(): Promise<void> {
    this.signingOut = true
    this.invalidateSession()
    try {
      await this.supabase.client.auth.signOut({scope: 'local'})
    } catch {
      // La redirección al login debe continuar aunque Supabase no pueda completar la limpieza remota.
    } finally {
      this.signingOut = false
    }
  }

  private authRedirectUrl(returnPath: string): string {
    const callback = new URL('/auth/callback', globalThis.location.origin)
    callback.searchParams.set('returnUrl', this.sanitizeReturnPath(returnPath))
    return callback.toString()
  }
}
