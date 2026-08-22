import {Routes} from '@angular/router';

export const LLIMBRO_ROUTES: Routes = [
  {path: '', redirectTo: 'nutrition', pathMatch: 'full'},
  {
    path: 'nutrition',
    loadChildren: () => import('./nutrition/nutrition.routes').then(({NUTRITION_ROUTES}) => NUTRITION_ROUTES),
  },
  {
    path: 'training',
    loadChildren: () => import('./training/training.routes').then(({TRAINING_ROUTES}) => TRAINING_ROUTES),
  },
];
