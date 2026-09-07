import {ChangeDetectionStrategy, Component, inject} from '@angular/core'
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'
import {DIALOG_DATA, DialogRef} from '@shared/ui/dialog'
import {FinanceMovement} from '../../models/finance.models'
import {FinanceStore} from '../../state/finance.store'

export type MovementFormData = {
  movement?: FinanceMovement
  defaults?: {
    categoryId?: number
    goalId?: number
    name?: string
    status?: FinanceMovement['status']
  }
}

@Component({
  selector: 'app-movement-form',
  imports: [ReactiveFormsModule],
  templateUrl: './movement-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {'data-area': 'finances'},
})
export class MovementFormComponent {
  protected readonly dialogRef = inject<DialogRef<void>>(DialogRef)
  protected readonly store = inject(FinanceStore)
  protected readonly data = inject<MovementFormData | undefined>(DIALOG_DATA) ?? {}
  private readonly formBuilder = inject(FormBuilder)
  protected readonly editing = Boolean(this.data.movement)
  protected error: string | null = null

  protected readonly form = this.formBuilder.group({
    name: [this.data.movement?.name ?? this.data.defaults?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    amount: [this.data.movement?.amount ?? 0, [Validators.required, Validators.min(0.01)]],
    categoryId: [this.data.movement?.category_id ?? this.data.defaults?.categoryId ?? this.store.categories()[0]?.id ?? null, Validators.required],
    goalId: [this.data.movement?.goal_id ?? this.data.defaults?.goalId ?? null as number | null],
    status: [this.data.movement?.status ?? this.data.defaults?.status ?? 'pending', Validators.required],
    scheduledOn: [this.data.movement?.scheduled_on ?? this.today(), Validators.required],
    occurredOn: [this.data.movement?.occurred_on ?? this.today()],
    notes: [this.data.movement?.notes ?? ''],
  })

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    const value = this.form.getRawValue()
    try {
      await this.store.saveMovement({
        id: this.data.movement?.id,
        recurring_item_id: this.data.movement?.recurring_item_id,
        recurrence_due_on: this.data.movement?.recurrence_due_on,
        name: value.name?.trim() ?? '',
        amount: Number(value.amount),
        category_id: Number(value.categoryId),
        goal_id: value.goalId ? Number(value.goalId) : null,
        status: value.status as FinanceMovement['status'],
        scheduled_on: value.scheduledOn ?? this.today(),
        occurred_on: value.status === 'completed' ? (value.occurredOn || value.scheduledOn) : null,
        notes: value.notes?.trim() || null,
      })
      this.dialogRef.close()
    } catch {
      this.error = 'Revisa los datos e inténtalo de nuevo.'
    }
  }

  protected async remove(): Promise<void> {
    const movement = this.data.movement
    if (!movement) return
    try {
      await this.store.deleteMovement(movement.id)
      this.dialogRef.close()
    } catch {
      this.error = 'No se pudo eliminar el movimiento.'
    }
  }

  private today(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
