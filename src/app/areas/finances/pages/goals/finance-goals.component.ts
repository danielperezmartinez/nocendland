import {DecimalPipe} from '@angular/common'
import {ChangeDetectionStrategy, Component, inject, Injector} from '@angular/core'
import {DialogService} from '@shared/ui/dialog'
import {FinanceGoal} from '../../models/finance.models'
import {FinanceStore} from '../../state/finance.store'
import {GoalFormComponent} from '../../ui/goal-form/goal-form.component'
import {MovementFormComponent} from '../../ui/movement-form/movement-form.component'
import {PeriodToolbarComponent} from '../../ui/period-toolbar/period-toolbar.component'

@Component({
  selector: 'app-finance-goals',
  imports: [DecimalPipe, PeriodToolbarComponent],
  templateUrl: './finance-goals.component.html',
  styleUrl: './finance-goals.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class FinanceGoalsComponent {
  protected readonly store = inject(FinanceStore)
  private readonly dialog = inject(DialogService)
  private readonly injector = inject(Injector)

  protected addGoal(): void {
    this.dialog.open(GoalFormComponent, {injector: this.injector})
  }

  protected editGoal(goal: FinanceGoal): void {
    this.dialog.open(GoalFormComponent, {data: {goal}, injector: this.injector})
  }

  protected contribute(goal: FinanceGoal): void {
    const savingCategory = this.store.categories().find(category => category.flow_type === 'saving')
    this.dialog.open(MovementFormComponent, {
      data: {
        defaults: {
          categoryId: savingCategory?.id,
          goalId: goal.id,
          name: `Aportación a ${goal.name}`,
          status: 'completed',
        },
      },
      injector: this.injector,
    })
  }
}
