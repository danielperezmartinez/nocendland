import {ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation} from '@angular/core'
import {toSignal} from '@angular/core/rxjs-interop'
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router'
import {FeatureSwipeNavigationDirective, FeatureTabBarComponent, FeatureTabItem} from '@shared/ui/feature-tab-bar'
import {filter} from 'rxjs'

export type FinanceTabId = 'summary' | 'movements' | 'recurring' | 'plan' | 'goals'

const FINANCE_TABS: readonly FeatureTabItem<FinanceTabId>[] = [
  {id: 'summary', label: 'Resumen', icon: 'analytics', commands: ['/finances', 'summary']},
  {id: 'movements', label: 'Movimientos', icon: 'category', commands: ['/finances', 'movements']},
  {id: 'recurring', label: 'Recurrentes', icon: 'refresh', commands: ['/finances', 'recurring']},
  {id: 'plan', label: 'Plan', icon: 'calendar_month', commands: ['/finances', 'plan']},
  {id: 'goals', label: 'Objetivos', icon: 'account_balance_wallet', commands: ['/finances', 'goals']},
]

@Component({
  selector: 'app-finance-layout',
  imports: [RouterOutlet, FeatureTabBarComponent, FeatureSwipeNavigationDirective],
  templateUrl: './finance-layout.component.html',
  styleUrl: './finance-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class FinanceLayoutComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    {initialValue: null},
  )

  protected readonly tabs = FINANCE_TABS
  protected readonly activeTabId = computed<FinanceTabId | null>(() => {
    this.navigationEnd()
    const tabId: unknown = this.route.firstChild?.snapshot.data['featureTab']
    return this.isFinanceTabId(tabId) ? tabId : null
  })

  private isFinanceTabId(value: unknown): value is FinanceTabId {
    return value === 'summary' || value === 'movements' || value === 'recurring' || value === 'plan' || value === 'goals'
  }
}
