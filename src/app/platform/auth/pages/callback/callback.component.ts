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
    const code = this.route.snapshot.queryParamMap.get('code')
    if (code) await this.auth.exchangeCodeForSession(code)

    const authenticated = await this.auth.isAuthenticated()
    const returnPath = this.auth.sanitizeReturnPath(this.route.snapshot.queryParamMap.get('returnUrl'))
    await this.router.navigateByUrl(authenticated ? returnPath : '/auth')
  }
}
