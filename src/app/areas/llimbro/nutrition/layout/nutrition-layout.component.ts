import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core'
import {toSignal} from '@angular/core/rxjs-interop'
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router'
import {FeatureSwipeNavigationDirective, FeatureTabBarComponent, FeatureTabItem} from '@shared/ui/feature-tab-bar'
import {filter} from 'rxjs'

export type NutritionTabId = 'ingredients' | 'intakes' | 'objectives'

const NUTRITION_TABS: readonly FeatureTabItem<NutritionTabId>[] = [
  {id: 'ingredients', label: 'Alimentos', icon: 'lunch_dining', commands: ['/llimbro', 'nutrition', 'ingredients']},
  {id: 'intakes', label: 'Ingesta', icon: 'calendar_month', commands: ['/llimbro', 'nutrition', 'intakes']},
  {id: 'objectives', label: 'Objetivos', icon: 'analytics', commands: ['/llimbro', 'nutrition', 'objectives']},
]

@Component({
  selector: 'app-nutrition-layout',
  imports: [RouterOutlet, FeatureTabBarComponent, FeatureSwipeNavigationDirective],
  templateUrl: './nutrition-layout.component.html',
  styleUrl: './nutrition-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NutritionLayoutComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    {initialValue: null},
  )

  protected readonly tabs = NUTRITION_TABS
  protected readonly activeTabId = computed<NutritionTabId | null>(() => {
    this.navigationEnd()
    const tabId: unknown = this.route.firstChild?.snapshot.data['featureTab']
    return this.isNutritionTabId(tabId) ? tabId : null
  })
  protected readonly swipeEnabled = computed(() => {
    this.navigationEnd()
    return this.route.firstChild?.snapshot.data['featureSwipe'] !== false
  })

  private isNutritionTabId(value: unknown): value is NutritionTabId {
    return value === 'ingredients' || value === 'intakes' || value === 'objectives'
  }
}
