import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from './auth.service';

export const emailAuthGuard: CanActivateFn = () => {
  return inject(AuthService).emailAuthEnabled || inject(Router).createUrlTree(['/auth'])
}

export const passwordRecoveryGuard: CanActivateFn = async () => {
  const auth = inject(AuthService)
  const router = inject(Router)
  return (auth.emailAuthEnabled && await auth.hasPasswordRecovery())
    || router.createUrlTree([auth.emailAuthEnabled ? '/auth/recover' : '/auth'])
}
