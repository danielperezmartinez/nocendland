import {ChangeDetectionStrategy, Component, computed, inject, Injector, signal} from '@angular/core'
import {DialogService} from '@shared/ui/dialog'
import {FinanceFlowType, FinanceMovement} from '../../models/finance.models'
import {FinanceStore} from '../../state/finance.store'
import {MovementFormComponent} from '../../ui/movement-form/movement-form.component'
import {PeriodToolbarComponent} from '../../ui/period-toolbar/period-toolbar.component'

type MovementFilter = 'all' | FinanceFlowType

@Component({
  selector: 'app-finance-movements',
  imports: [PeriodToolbarComponent],
  templateUrl: './finance-movements.component.html',
  styleUrl: './finance-movements.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class FinanceMovementsComponent {
  protected readonly store = inject(FinanceStore)
  private readonly dialog = inject(DialogService)
  private readonly injector = inject(Injector)
  protected readonly filter = signal<MovementFilter>('all')
  protected readonly query = signal('')
  protected readonly filters: readonly {id: MovementFilter; label: string}[] = [
    {id: 'all', label: 'Todos'},
    {id: 'income', label: 'Ingresos'},
    {id: 'expense', label: 'Gastos'},
    {id: 'saving', label: 'Ahorro'},
  ]

  protected readonly visibleMovements = computed(() => {
    const filter = this.filter()
    const query = this.query().trim().toLocaleLowerCase('es-ES')
    return this.store.movementViews().filter(movement =>
      (filter === 'all' || movement.flowType === filter)
      && (!query || movement.name.toLocaleLowerCase('es-ES').includes(query)
        || movement.categoryName.toLocaleLowerCase('es-ES').includes(query)),
    )
  })

  protected addMovement(): void {
    this.dialog.open(MovementFormComponent, {injector: this.injector})
  }

  protected editMovement(movement: FinanceMovement): void {
    this.dialog.open(MovementFormComponent, {data: {movement}, injector: this.injector})
  }

  protected updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value)
  }
}
