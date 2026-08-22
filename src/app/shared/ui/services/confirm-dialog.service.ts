import {Injectable} from '@angular/core'
import {Observable, map} from 'rxjs'
import {ConfirmDialogComponent} from '@shared/ui/confirm-dialog/confirm-dialog.component'
import {DialogService} from '@shared/ui/dialog/dialog.service'

export type DialogConfirm = {
  title: string
  message: string
  acceptButton?: DialogConfirmButton
  cancelButton?: DialogConfirmButton
}

type DialogConfirmButton = {
  text?: string
  show?: boolean
  intent?: 'danger' | 'primary'
}

@Injectable({providedIn: 'root'})
export class ConfirmDialogService {
  constructor(private readonly dialog: DialogService) {}

  open(config: DialogConfirm): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, DialogConfirm, boolean>(ConfirmDialogComponent, {data: config, width: 'min(30rem, calc(100vw - 2rem))'})
      .afterClosed
      .pipe(map(result => result ?? false))
  }
}
