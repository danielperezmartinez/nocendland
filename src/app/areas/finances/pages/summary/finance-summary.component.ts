import {ChangeDetectionStrategy, Component, computed, inject, Injector} from '@angular/core'
import {DialogService} from '@shared/ui/dialog'
import {FinanceStore} from '../../state/finance.store'
import {MovementFormComponent} from '../../ui/movement-form/movement-form.component'
import {PeriodToolbarComponent} from '../../ui/period-toolbar/period-toolbar.component'

@Component({
  selector: 'app-finance-summary',
  imports: [PeriodToolbarComponent],
  templateUrl: './finance-summary.component.html',
  styleUrl: './finance-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class FinanceSummaryComponent {
  protected readonly store = inject(FinanceStore)
  private readonly dialog = inject(DialogService)
  private readonly injector = inject(Injector)

  protected readonly upcoming = computed(() => this.store.movementViews()
    .filter(movement => movement.status === 'pending')
    .sort((first, second) => first.scheduled_on.localeCompare(second.scheduled_on))
    .slice(0, 5))

  protected readonly distribution = computed(() => {
    const summary = this.store.summary()
    const total = summary.plannedExpense + summary.plannedSaving
    return [
      {label: 'Gastos', value: summary.plannedExpense, percentage: total ? summary.plannedExpense / total * 100 : 0},
      {label: 'Ahorro', value: summary.plannedSaving, percentage: total ? summary.plannedSaving / total * 100 : 0},
    ]
  })

  protected addMovement(): void {
    this.dialog.open(MovementFormComponent, {injector: this.injector})
  }
}
