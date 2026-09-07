import {ChangeDetectionStrategy, Component, inject} from '@angular/core'
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'
import {DialogRef} from '@shared/ui/dialog'
import {FinanceStore} from '../../state/finance.store'

@Component({
  selector: 'app-finance-settings-form',
  imports: [ReactiveFormsModule],
  templateUrl: './settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {'data-area': 'finances'},
})
export class SettingsFormComponent {
  protected readonly dialogRef = inject<DialogRef<void>>(DialogRef)
  protected readonly store = inject(FinanceStore)
  private readonly formBuilder = inject(FormBuilder)
  protected error: string | null = null

  protected readonly form = this.formBuilder.group({
    periodStartDay: [this.store.settings()?.period_start_day ?? 1, [Validators.required, Validators.min(1), Validators.max(31)]],
    currencyCode: [this.store.settings()?.currency_code ?? 'EUR', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
  })

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    const value = this.form.getRawValue()
    try {
      await this.store.saveSettings({
        period_start_day: Number(value.periodStartDay),
        currency_code: (value.currencyCode ?? 'EUR').trim().toUpperCase(),
      })
      this.dialogRef.close()
    } catch {
      this.error = 'No se pudo actualizar la configuración.'
    }
  }
}
