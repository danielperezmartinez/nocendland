import {CanActivateChildFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from './auth.service';

export const authGuard: CanActivateChildFn = async (childRoute, state) => {
  const auth = inject(AuthService)
  const router: Router = inject(Router)

  let authenticated = false
  try {
    authenticated = await auth.isAuthenticated()
  } catch {
    // Un fallo de recuperación no debe cancelar la navegación inicial y dejar la aplicación vacía.
  }
  if (!authenticated) {
    return router.createUrlTree(['/auth'], {queryParams: {returnUrl: auth.sanitizeReturnPath(state.url)}})
  }

  return true
}
