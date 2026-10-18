import {Routes} from '@angular/router';
import {emailAuthGuard, passwordRecoveryGuard} from './email-auth.guard';

export const AUTH_ROUTES: Routes = [
  ...(['email', 'register', 'verify', 'recover', 'reset-password'] as const).map(path => ({
    path,
    canActivate: [path === 'reset-password' ? passwordRecoveryGuard : emailAuthGuard],
    loadComponent: () => import('./pages/email/email-auth.component').then(({EmailAuthComponent}) => EmailAuthComponent),
    data: {mode: path},
  })),
  {
    path: '',
    loadComponent: () => import('./pages/login/login.component').then(({LoginComponent}) => LoginComponent),
  },
  {
    path: 'callback',
    loadComponent: () => import('./pages/callback/callback.component').then(({CallbackComponent}) => CallbackComponent),
  },
];
