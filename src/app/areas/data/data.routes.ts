import {Routes} from '@angular/router'

export const DATA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/coming-soon/coming-soon.component')
      .then(({ComingSoonComponent}) => ComingSoonComponent),
  },
]
