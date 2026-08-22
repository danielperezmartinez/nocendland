import {ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation} from '@angular/core'
import {toSignal} from '@angular/core/rxjs-interop'
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router'
import {FeatureSwipeNavigationDirective, FeatureTabBarComponent, FeatureTabItem} from '@shared/ui/feature-tab-bar'
import {filter} from 'rxjs'

export type TrainingTabId = 'exercises' | 'schedule' | 'tracking' | 'measurements'

export const TRAINING_TABS: readonly FeatureTabItem<TrainingTabId>[] = [
  {id: 'exercises', label: 'Ejercicios', icon: 'fitness_center', commands: ['/llimbro', 'training', 'exercises']},
  {id: 'schedule', label: 'Horario', icon: 'calendar_month', commands: ['/llimbro', 'training', 'schedule']},
  {id: 'tracking', label: 'Seguimiento', icon: 'analytics', commands: ['/llimbro', 'training', 'tracking']},
  {id: 'measurements', label: 'Medidas', icon: 'straighten', commands: ['/llimbro', 'training', 'measurements']},
]

@Component({
  selector: 'app-training-layout',
  imports: [RouterOutlet, FeatureTabBarComponent, FeatureSwipeNavigationDirective],
  templateUrl: './training-layout.component.html',
  styleUrl: './training-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class TrainingLayoutComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    {initialValue: null},
  )

  protected readonly tabs = TRAINING_TABS
  protected readonly activeTabId = computed<TrainingTabId | null>(() => {
    this.navigationEnd()
    const tabId: unknown = this.route.firstChild?.snapshot.data['featureTab']
    return this.isTrainingTabId(tabId) ? tabId : null
  })
  protected readonly swipeEnabled = computed(() => {
    this.navigationEnd()
    return this.route.firstChild?.snapshot.data['featureSwipe'] !== false
  })

  private isTrainingTabId(value: unknown): value is TrainingTabId {
    return value === 'exercises' || value === 'schedule' || value === 'tracking' || value === 'measurements'
  }
}
