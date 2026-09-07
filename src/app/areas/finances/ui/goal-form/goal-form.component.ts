import {ChangeDetectionStrategy, Component, inject} from '@angular/core'
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'
import {DIALOG_DATA, DialogRef} from '@shared/ui/dialog'
import {FinanceGoal} from '../../models/finance.models'
import {FinanceStore} from '../../state/finance.store'

export type GoalFormData = {goal?: FinanceGoal}

@Component({
  selector: 'app-goal-form',
  imports: [ReactiveFormsModule],
  templateUrl: './goal-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {'data-area': 'finances'},
})
export class GoalFormComponent {
  protected readonly dialogRef = inject<DialogRef<void>>(DialogRef)
  protected readonly store = inject(FinanceStore)
  protected readonly data = inject<GoalFormData | undefined>(DIALOG_DATA) ?? {}
  private readonly formBuilder = inject(FormBuilder)
  protected readonly editing = Boolean(this.data.goal)
  protected error: string | null = null

  protected readonly form = this.formBuilder.group({
    name: [this.data.goal?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    targetAmount: [this.data.goal?.target_amount ?? 0, [Validators.required, Validators.min(0.01)]],
    initialAmount: [this.data.goal?.initial_amount ?? 0, [Validators.required, Validators.min(0)]],
    targetDate: [this.data.goal?.target_date ?? ''],
    status: [this.data.goal?.status ?? 'active', Validators.required],
    notes: [this.data.goal?.notes ?? ''],
  })

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    const value = this.form.getRawValue()
    try {
      await this.store.saveGoal({
        id: this.data.goal?.id,
        name: value.name?.trim() ?? '',
        target_amount: Number(value.targetAmount),
        initial_amount: Number(value.initialAmount),
        target_date: value.targetDate || null,
        status: value.status as FinanceGoal['status'],
        notes: value.notes?.trim() || null,
      })
      this.dialogRef.close()
    } catch {
      this.error = 'No se pudo guardar el objetivo.'
    }
  }

  protected async archive(): Promise<void> {
    if (!this.data.goal) return
    try {
      await this.store.archiveGoal(this.data.goal.id)
      this.dialogRef.close()
    } catch {
      this.error = 'No se pudo archivar el objetivo.'
    }
  }
}
