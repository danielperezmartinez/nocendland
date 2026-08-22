import {ChangeDetectionStrategy, Component, inject} from '@angular/core'
import {DialogConfirm} from '@shared/ui/services/confirm-dialog.service'
import {UI_TEXT} from '@shared/ui/ui-text.constants'
import {DIALOG_DATA} from '@shared/ui/dialog/dialog.tokens'
import {DialogRef} from '@shared/ui/dialog/dialog-ref'

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  protected readonly data = inject(DIALOG_DATA) as DialogConfirm
  protected readonly text = UI_TEXT
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef)

  protected close(accepted: boolean): void {
    this.dialogRef.close(accepted)
  }
}
