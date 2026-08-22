import {Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {OAuthResponse} from '@supabase/supabase-js';
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {Database} from '@platform/supabase/database.types';

export type AuthProvider = 'github' | 'google'
export type AppUser = Database['public']['Tables']['user']['Row']

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly userState = signal<AppUser | undefined>(undefined)

  readonly user = this.userState.asReadonly()

  constructor(
    private readonly supabase: SupabaseClientService,
    private readonly router: Router,
  ) {}

  public async isAuthenticated(): Promise<boolean> {
    const {data, error} = await this.supabase.client.auth.getUser()
    if (error || !data.user) {
      this.userState.set(undefined)
      return false
    }

    await this.loadUserProfile(data.user.id)
    return true
  }

  public exchangeCodeForSession(code: string) {
    return this.supabase.client.auth.exchangeCodeForSession(code)
  }

  public signInWithGithub(returnPath = '/'): Promise<OAuthResponse> {
    return this.signInWithOAuth('github', returnPath)
  }

  public signInWithGoogle(returnPath = '/'): Promise<OAuthResponse> {
    return this.signInWithOAuth('google', returnPath)
  }

  public async signOut(): Promise<void> {
    const {error} = await this.supabase.client.auth.signOut()
    if (error) throw error

    this.userState.set(undefined)
    await this.router.navigateByUrl('/auth')
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

  private async loadUserProfile(userId: string): Promise<void> {
    const {data, error} = await this.supabase.client
      .from('user')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    this.userState.set(data)
  }

  private authRedirectUrl(returnPath: string): string {
    const callback = new URL('/auth/callback', globalThis.location.origin)
    callback.searchParams.set('returnUrl', this.sanitizeReturnPath(returnPath))
    return callback.toString()
  }
}
