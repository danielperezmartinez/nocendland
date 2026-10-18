import {Component, ChangeDetectionStrategy, signal} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {AuthService} from '@platform/auth/auth.service';

@Component({
    selector: 'app-login',
  imports: [RouterLink],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  protected readonly busy = signal(false)
  protected readonly error = signal('')
  protected readonly returnPath: string

  constructor(protected auth: AuthService, route: ActivatedRoute) {
    this.returnPath = auth.sanitizeReturnPath(route.snapshot.queryParamMap.get('returnUrl'))
    if (route.snapshot.queryParamMap.has('error')) this.error.set('No se pudo completar el acceso. Vuelve a intentarlo.')
  }

  protected async signIn(provider: 'github' | 'google'): Promise<void> {
    if (this.busy()) return
    this.busy.set(true)
    this.error.set('')
    try {
      const result = await (provider === 'github'
        ? this.auth.signInWithGithub(this.returnPath) : this.auth.signInWithGoogle(this.returnPath))
      if (result?.error) throw result.error
    } catch {
      this.error.set('No se pudo iniciar sesión. Vuelve a intentarlo.')
    } finally {
      this.busy.set(false)
    }
  }
}
