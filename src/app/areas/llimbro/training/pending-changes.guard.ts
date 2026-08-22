import {inject} from '@angular/core'
import {CanDeactivateFn} from '@angular/router'
import {ConfirmDialogService} from '@shared/ui/confirm-dialog'

export interface TrainingPendingChanges {
  hasPendingChanges(): boolean
}

export const confirmPendingTrainingChanges: CanDeactivateFn<TrainingPendingChanges> = component => {
  if (!component.hasPendingChanges()) return true
  return inject(ConfirmDialogService).open({
    title: 'Descartar cambios',
    message: 'Hay cambios sin guardar. Si continúas, se perderán.',
    acceptButton: {text: 'Descartar', show: true, intent: 'danger'},
  })
}
