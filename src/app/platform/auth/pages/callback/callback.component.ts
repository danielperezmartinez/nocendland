import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '@platform/auth/auth.service';

@Component({
  selector: 'app-callback',
  imports: [],
  templateUrl: './callback.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './callback.component.scss',
})
export class CallbackComponent implements OnInit {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  public async ngOnInit(): Promise<void> {
    const returnPath = this.auth.sanitizeReturnPath(this.route.snapshot.queryParamMap.get('returnUrl'))
    try {
      if (this.route.snapshot.queryParamMap.has('error')) throw new Error('OAuth rejected')
      const code = this.route.snapshot.queryParamMap.get('code')
      if (code) await this.auth.exchangeCodeForSession(code)
      if (this.auth.emailAuthEnabled && this.auth.recoveryUserId()) {
        await this.router.navigateByUrl('/auth/reset-password', {replaceUrl: true})
        return
      }
      const authenticated = await this.auth.isAuthenticated()
      await this.router.navigateByUrl(authenticated ? returnPath : '/auth', {replaceUrl: true})
    } catch {
      await this.router.navigate(['/auth'], {queryParams: {returnUrl: returnPath, error: 'callback'}, replaceUrl: true})
    }
  }
}
