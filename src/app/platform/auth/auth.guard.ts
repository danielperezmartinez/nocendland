import {CanActivateChildFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from './auth.service';

export const authGuard: CanActivateChildFn = async (childRoute, state) => {
  const auth = inject(AuthService)
  const router: Router = inject(Router)

  const authenticated = await auth.isAuthenticated()
  if (!authenticated) {
    return router.createUrlTree(['/auth'], {queryParams: {returnUrl: auth.sanitizeReturnPath(state.url)}})
  }

  return true
}
