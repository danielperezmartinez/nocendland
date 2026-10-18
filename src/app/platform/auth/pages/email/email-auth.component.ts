import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AuthService} from '../../auth.service';

type EmailMode = 'email' | 'register' | 'verify' | 'recover' | 'reset-password'
type CodePurpose = 'login' | 'register' | 'confirmation' | 'recovery'

@Component({
  selector: 'app-email-auth',
  imports: [RouterLink],
  templateUrl: './email-auth.component.html',
  styleUrls: ['../login/login.component.scss', './email-auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailAuthComponent {
  protected readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  private readonly destroyRef = inject(DestroyRef)
  protected readonly mode = this.route.snapshot.data['mode'] as EmailMode
  protected readonly returnPath = this.auth.sanitizeReturnPath(this.route.snapshot.queryParamMap.get('returnUrl'))
  private readonly navigationState = this.router.currentNavigation()?.extras.state ?? history.state
  protected readonly email = signal(typeof this.navigationState?.email === 'string' ? this.navigationState.email : '')
  protected readonly password = signal('')
  protected readonly confirmation = signal('')
  protected readonly token = signal('')
  protected readonly useCode = signal(false)
  protected readonly busy = signal(false)
  protected readonly error = signal('')
  protected readonly notice = signal('')
  protected readonly confirmationNeeded = signal(false)
  protected readonly remaining = signal(this.mode === 'verify' ? 60 : 0)
  protected readonly purpose: CodePurpose = ['login', 'register', 'confirmation', 'recovery'].includes(this.navigationState?.purpose)
    ? this.navigationState.purpose : 'login'
  protected readonly title = {
    email: 'Vuelve a tu atlas.', register: 'Empieza a cuidarte.', verify: 'Revisa tu correo.',
    recover: 'Recupera tu acceso.', 'reset-password': 'Una nueva contraseña.',
  }[this.mode]
  protected readonly intro = {
    email: 'Entra con tu contraseña o recibe un código de un solo uso.',
    register: 'Crea tu cuenta con contraseña o con un código por correo.',
    verify: 'Si la solicitud puede completarse, recibirás un código. Introdúcelo aquí para continuar.',
    recover: 'Te enviaremos un código para que puedas elegir otra contraseña.',
    'reset-password': 'Guarda una contraseña nueva para volver a tu espacio.',
  }[this.mode]
  protected readonly needsPassword = computed(() => this.mode === 'reset-password'
    || ((this.mode === 'email' || this.mode === 'register') && !this.useCode()))
  protected readonly needsConfirmation = computed(() => this.needsPassword() && this.mode !== 'email')

  constructor() {
    const timer = setInterval(() => this.remaining.update(value => Math.max(0, value - 1)), 1000)
    this.destroyRef.onDestroy(() => clearInterval(timer))
  }

  protected toggleMethod(): void {
    this.useCode.update(value => !value)
    this.password.set('')
    this.confirmation.set('')
    this.error.set('')
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault()
    if (this.needsConfirmation() && this.password() !== this.confirmation()) {
      this.error.set('Las contraseñas no coinciden.')
      return
    }
    await this.run(async () => {
      switch (this.mode) {
        case 'email':
          if (this.useCode()) {
            await this.auth.sendEmailCode(this.email(), false)
            await this.openVerification('login')
          } else {
            await this.auth.signInWithPassword(this.email(), this.password())
            await this.enterApp()
          }
          break
        case 'register':
          if (this.useCode()) await this.auth.sendEmailCode(this.email(), true)
          else await this.auth.signUpWithPassword(this.email(), this.password())
          await this.openVerification(this.useCode() ? 'register' : 'confirmation')
          break
        case 'verify':
          await this.auth.verifyEmailCode(this.email(), this.token(), this.purpose === 'recovery')
          if (this.destroyRef.destroyed) return
          if (this.purpose === 'recovery') await this.router.navigate(['/auth/reset-password'], {queryParams: {returnUrl: this.returnPath}, replaceUrl: true})
          else await this.enterApp()
          break
        case 'recover':
          await this.auth.requestPasswordReset(this.email())
          await this.openVerification('recovery')
          break
        case 'reset-password':
          await this.auth.resetPassword(this.password())
          await this.enterApp()
          break
      }
    })
  }

  protected async resend(): Promise<void> {
    if (this.remaining()) return
    await this.run(async () => {
      if (this.purpose === 'confirmation') await this.auth.resendConfirmation(this.email())
      else if (this.purpose === 'recovery') await this.auth.requestPasswordReset(this.email())
      else await this.auth.sendEmailCode(this.email(), this.purpose === 'register')
      this.remaining.set(60)
      this.notice.set('Si la solicitud puede completarse, recibirás un nuevo código.')
    })
  }

  protected async sendConfirmation(): Promise<void> {
    await this.run(async () => {
      await this.auth.resendConfirmation(this.email())
      await this.openVerification('confirmation')
    })
  }

  protected async cancelRecovery(): Promise<void> {
    await this.run(() => this.auth.signOut())
  }

  private async openVerification(purpose: CodePurpose): Promise<void> {
    this.password.set('')
    this.confirmation.set('')
    if (this.destroyRef.destroyed) return
    await this.router.navigate(['/auth/verify'], {
      queryParams: {returnUrl: this.returnPath}, state: {email: this.email().trim(), purpose},
    })
  }

  private async enterApp(): Promise<void> {
    if (this.auth.recoveryUserId()) {
      await this.router.navigateByUrl('/auth/reset-password')
      return
    }
    if (!await this.auth.isAuthenticated()) throw new Error('profile_unavailable')
    if (!this.destroyRef.destroyed) await this.router.navigateByUrl(this.returnPath, {replaceUrl: true})
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    if (this.busy()) return
    this.busy.set(true)
    this.error.set('')
    this.notice.set('')
    this.confirmationNeeded.set(false)
    try {
      await action()
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
      if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
        this.remaining.set(60)
        this.error.set('Has realizado demasiados intentos. Espera un minuto y vuelve a intentarlo.')
      } else if (code === 'email_not_confirmed') {
        this.confirmationNeeded.set(true)
        this.error.set('Confirma primero tu correo. Puedes solicitar otro código aquí.')
      } else if (code === 'weak_password') {
        this.error.set('La contraseña no cumple los requisitos de seguridad. Elige una más larga y difícil de adivinar.')
      } else if (this.mode === 'verify') {
        this.error.set('No se pudo verificar el código. Comprueba que sea el último recibido y que no haya caducado.')
      } else if (this.mode === 'email') {
        this.error.set('No se pudo iniciar sesión. Revisa los datos o solicita un código e inténtalo de nuevo.')
      } else {
        this.error.set('No se pudo completar la solicitud. Comprueba tu conexión y vuelve a intentarlo.')
      }
    } finally {
      this.password.set('')
      this.confirmation.set('')
      this.busy.set(false)
    }
  }
}
