import {Component, ChangeDetectionStrategy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '@platform/auth/auth.service';

@Component({
    selector: 'app-login',
  imports: [],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  protected readonly returnPath: string

  constructor(protected auth: AuthService, route: ActivatedRoute) {
    this.returnPath = auth.sanitizeReturnPath(route.snapshot.queryParamMap.get('returnUrl'))
  }
}
