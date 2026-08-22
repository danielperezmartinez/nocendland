import {Component, ChangeDetectionStrategy} from '@angular/core';

import {AuthService} from '@platform/auth/auth.service';

@Component({
    selector: 'app-user-info',
    imports: [],
    templateUrl: './user-info.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './user-info.component.scss'
})
export class UserInfoComponent {

  constructor(public auth: AuthService) {
  }
}
