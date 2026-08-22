import {Routes} from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login.component').then(({LoginComponent}) => LoginComponent),
  },
  {
    path: 'callback',
    loadComponent: () => import('./pages/callback/callback.component').then(({CallbackComponent}) => CallbackComponent),
  },
];
