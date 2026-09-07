import {ChangeDetectionStrategy, Component, computed, inject, linkedSignal} from '@angular/core'
import {FinanceFlowType} from '../../models/finance.models'
import {FinanceStore} from '../../state/finance.store'
import {PeriodToolbarComponent} from '../../ui/period-toolbar/period-toolbar.component'

@Component({
  selector: 'app-finance-plan',
  imports: [PeriodToolbarComponent],
  templateUrl: './finance-plan.component.html',
  styleUrl: './finance-plan.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class FinancePlanComponent {
  protected readonly store = inject(FinanceStore)
  protected readonly openingBalance = linkedSignal(() => this.store.period()?.opening_balance ?? 0)
  protected readonly plannedValues = linkedSignal(() => new Map(
    this.store.budgetRows().map(row => [row.category.id, row.plannedAmount]),
  ))
  protected readonly flowGroups: readonly {type: FinanceFlowType; label: string; description: string}[] = [
    {type: 'income', label: 'Ingresos previstos', description: 'Dinero que estará disponible en el periodo.'},
    {type: 'expense', label: 'Gastos', description: 'Compromisos fijos y límites para el gasto variable.'},
    {type: 'saving', label: 'Ahorro e inversión', description: 'Dinero que apartas antes de calcular el remanente.'},
  ]

  protected readonly plannedIncome = computed(() => this.totalFor('income'))
  protected readonly plannedExpense = computed(() => this.totalFor('expense'))
  protected readonly plannedSaving = computed(() => this.totalFor('saving'))
  protected readonly projectedRemainder = computed(() =>
    this.openingBalance() + this.plannedIncome() - this.plannedExpense() - this.plannedSaving())
  protected readonly dirty = computed(() => {
    if (this.openingBalance() !== (this.store.period()?.opening_balance ?? 0)) return true
    return this.store.budgetRows().some(row =>
      (this.plannedValues().get(row.category.id) ?? 0) !== row.plannedAmount)
  })

  protected rowsFor(flowType: FinanceFlowType) {
    return this.store.budgetRows().filter(row => row.category.flow_type === flowType)
  }

  protected updateOpeningBalance(event: Event): void {
    this.openingBalance.set(this.numberValue(event))
  }

  protected updatePlannedAmount(categoryId: number, event: Event): void {
    const amount = Math.max(0, this.numberValue(event))
    this.plannedValues.update(values => new Map(values).set(categoryId, amount))
  }

  protected progress(actual: number, categoryId: number): number {
    const planned = this.plannedValues().get(categoryId) ?? 0
    return planned > 0 ? Math.min(100, actual / planned * 100) : 0
  }

  protected async save(): Promise<void> {
    await this.store.savePlan(this.openingBalance(), this.plannedValues())
  }

  private totalFor(flowType: FinanceFlowType): number {
    return this.rowsFor(flowType).reduce((sum, row) => sum + (this.plannedValues().get(row.category.id) ?? 0), 0)
  }

  private numberValue(event: Event): number {
    const value = Number((event.target as HTMLInputElement).value)
    return Number.isFinite(value) ? value : 0
  }
}
