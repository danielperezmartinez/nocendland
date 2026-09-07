import {Routes} from '@angular/router'
import {FinanceRepository} from './data-access/finance.repository'
import {FinanceLayoutComponent} from './layout/finance-layout.component'
import {FinanceStore} from './state/finance.store'

export const FINANCES_ROUTES: Routes = [
  {
    path: '',
    component: FinanceLayoutComponent,
    providers: [FinanceRepository, FinanceStore],
    children: [
      {path: '', redirectTo: 'summary', pathMatch: 'full'},
      {
        path: 'summary',
        data: {featureTab: 'summary'},
        loadComponent: () => import('./pages/summary/finance-summary.component')
          .then(({FinanceSummaryComponent}) => FinanceSummaryComponent),
      },
      {
        path: 'movements',
        data: {featureTab: 'movements'},
        loadComponent: () => import('./pages/movements/finance-movements.component')
          .then(({FinanceMovementsComponent}) => FinanceMovementsComponent),
      },
      {
        path: 'recurring',
        data: {featureTab: 'recurring'},
        loadComponent: () => import('./pages/recurring/finance-recurring.component')
          .then(({FinanceRecurringComponent}) => FinanceRecurringComponent),
      },
      {
        path: 'plan',
        data: {featureTab: 'plan'},
        loadComponent: () => import('./pages/plan/finance-plan.component')
          .then(({FinancePlanComponent}) => FinancePlanComponent),
      },
      {
        path: 'goals',
        data: {featureTab: 'goals'},
        loadComponent: () => import('./pages/goals/finance-goals.component')
          .then(({FinanceGoalsComponent}) => FinanceGoalsComponent),
      },
    ],
  },
]
