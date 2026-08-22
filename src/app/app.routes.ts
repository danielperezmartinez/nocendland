import {Routes} from '@angular/router';
import {authGuard} from '@platform/auth/auth.guard';
import {MainpageComponent} from '@shell/layout/mainpage/mainpage.component';
import {SideNavMenuComponent} from '@shell/layout/side-nav-menu/side-nav-menu.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@platform/auth/auth.routes').then(({AUTH_ROUTES}) => AUTH_ROUTES),
  },
  {
    path: 'share/training/:token',
    loadComponent: () => import('@areas/llimbro/training/pages/share-preview/share-preview.component')
      .then(({SharePreviewComponent}) => SharePreviewComponent),
  },
  {
    path: '',
    component: MainpageComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {path: '', component: SideNavMenuComponent, pathMatch: 'full'},
      {
        path: 'llimbro',
        loadChildren: () => import('@areas/llimbro/llimbro.routes').then(({LLIMBRO_ROUTES}) => LLIMBRO_ROUTES),
      },
      {
        path: 'miscellaneous',
        loadChildren: () => import('@areas/miscellaneous/miscellaneous.routes')
          .then(({MISCELLANEOUS_ROUTES}) => MISCELLANEOUS_ROUTES),
      },
      {
        path: 'finances',
        loadChildren: () => import('@areas/finances/finances.routes').then(({FINANCES_ROUTES}) => FINANCES_ROUTES),
      },
      {path: 'nutrition', redirectTo: 'llimbro/nutrition', pathMatch: 'full'},
      {path: 'nutrition/ingredients', redirectTo: 'llimbro/nutrition/ingredients', pathMatch: 'full'},
      {path: 'nutrition/intakes', redirectTo: 'llimbro/nutrition/intakes', pathMatch: 'full'},
      {path: 'nutrition/objectives', redirectTo: 'llimbro/nutrition/objectives', pathMatch: 'full'},
      {
        path: 'nutrition/ingredient-form/:id',
        redirectTo: ({params}) => `llimbro/nutrition/ingredient-form/${params['id']}`,
        pathMatch: 'full',
      },
    ],
  },
  {path: '**', redirectTo: ''},
];
