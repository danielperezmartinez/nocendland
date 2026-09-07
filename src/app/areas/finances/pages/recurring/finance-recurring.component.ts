import {ChangeDetectionStrategy, Component, computed, inject, Injector} from '@angular/core'
import {DialogService} from '@shared/ui/dialog'
import {FinanceRecurringItem} from '../../models/finance.models'
import {FinanceStore} from '../../state/finance.store'
import {PeriodToolbarComponent} from '../../ui/period-toolbar/period-toolbar.component'
import {RecurringFormComponent} from '../../ui/recurring-form/recurring-form.component'

@Component({
  selector: 'app-finance-recurring',
  imports: [PeriodToolbarComponent],
  templateUrl: './finance-recurring.component.html',
  styleUrl: './finance-recurring.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class FinanceRecurringComponent {
  protected readonly store = inject(FinanceStore)
  private readonly dialog = inject(DialogService)
  private readonly injector = inject(Injector)
  protected readonly monthlyTotal = computed(() => this.store.recurringViews()
    .filter(item => item.flowType !== 'income')
    .reduce((sum, item) => sum + item.monthlyEquivalent, 0))

  protected addRecurring(): void {
    this.dialog.open(RecurringFormComponent, {injector: this.injector})
  }

  protected editRecurring(item: FinanceRecurringItem): void {
    this.dialog.open(RecurringFormComponent, {data: {item}, injector: this.injector})
  }

  protected frequencyLabel(intervalMonths: number): string {
    if (intervalMonths === 1) return 'Mensual'
    if (intervalMonths === 3) return 'Trimestral'
    if (intervalMonths === 6) return 'Semestral'
    if (intervalMonths === 12) return 'Anual'
    return `Cada ${intervalMonths} meses`
  }
}
