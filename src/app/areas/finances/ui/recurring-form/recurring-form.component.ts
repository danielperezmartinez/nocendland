import {ChangeDetectionStrategy, Component, inject} from '@angular/core'
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'
import {DIALOG_DATA, DialogRef} from '@shared/ui/dialog'
import {FinanceRecurringItem} from '../../models/finance.models'
import {FinanceStore} from '../../state/finance.store'

export type RecurringFormData = {item?: FinanceRecurringItem}

@Component({
  selector: 'app-recurring-form',
  imports: [ReactiveFormsModule],
  templateUrl: './recurring-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {'data-area': 'finances'},
})
export class RecurringFormComponent {
  protected readonly dialogRef = inject<DialogRef<void>>(DialogRef)
  protected readonly store = inject(FinanceStore)
  protected readonly data = inject<RecurringFormData | undefined>(DIALOG_DATA) ?? {}
  private readonly formBuilder = inject(FormBuilder)
  protected readonly editing = Boolean(this.data.item)
  protected error: string | null = null

  protected readonly form = this.formBuilder.group({
    name: [this.data.item?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    amount: [this.data.item?.amount ?? 0, [Validators.required, Validators.min(0.01)]],
    categoryId: [this.data.item?.category_id ?? this.store.categories()[0]?.id ?? null, Validators.required],
    goalId: [this.data.item?.goal_id ?? null as number | null],
    startsOn: [this.data.item?.starts_on ?? this.today(), Validators.required],
    endsOn: [this.data.item?.ends_on ?? ''],
    dueDay: [this.data.item?.due_day ?? new Date().getDate(), [Validators.required, Validators.min(1), Validators.max(31)]],
    intervalMonths: [this.data.item?.interval_months ?? 1, [Validators.required, Validators.min(1), Validators.max(120)]],
    notes: [this.data.item?.notes ?? ''],
  })

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    const value = this.form.getRawValue()
    try {
      await this.store.saveRecurringItem({
        id: this.data.item?.id,
        name: value.name?.trim() ?? '',
        amount: Number(value.amount),
        category_id: Number(value.categoryId),
        goal_id: value.goalId ? Number(value.goalId) : null,
        starts_on: value.startsOn ?? this.today(),
        ends_on: value.endsOn || null,
        due_day: Number(value.dueDay),
        interval_months: Number(value.intervalMonths),
        notes: value.notes?.trim() || null,
      })
      this.dialogRef.close()
    } catch {
      this.error = 'Revisa las fechas y los importes antes de guardar.'
    }
  }

  protected async archive(): Promise<void> {
    if (!this.data.item) return
    try {
      await this.store.archiveRecurringItem(this.data.item.id)
      this.dialogRef.close()
    } catch {
      this.error = 'No se pudo archivar el recurrente.'
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
