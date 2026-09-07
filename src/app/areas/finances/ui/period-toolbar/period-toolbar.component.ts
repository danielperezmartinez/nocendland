import {ChangeDetectionStrategy, Component, inject, Injector} from '@angular/core'
import {DialogService} from '@shared/ui/dialog'
import {FinanceStore} from '../../state/finance.store'
import {SettingsFormComponent} from '../settings-form/settings-form.component'

@Component({
  selector: 'app-finance-period-toolbar',
  templateUrl: './period-toolbar.component.html',
  styleUrl: './period-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PeriodToolbarComponent {
  protected readonly store = inject(FinanceStore)
  private readonly dialog = inject(DialogService)
  private readonly injector = inject(Injector)

  protected openSettings(): void {
    this.dialog.open(SettingsFormComponent, {injector: this.injector, width: 'min(36rem, calc(100vw - 2rem))'})
  }
}
