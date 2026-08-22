import {FocusTrapFactory} from '@angular/cdk/a11y'
import {Overlay} from '@angular/cdk/overlay'
import {ComponentPortal} from '@angular/cdk/portal'
import {EnvironmentInjector, Injectable, Injector, Type} from '@angular/core'
import {DIALOG_DATA} from './dialog.tokens'
import {DialogRef} from './dialog-ref'

export type DialogConfig<Data> = {
  data?: Data
  width?: string
  closeOnBackdrop?: boolean
  injector?: Injector
}

@Injectable({providedIn: 'root'})
export class DialogService {
  constructor(
    private readonly overlay: Overlay,
    private readonly environmentInjector: EnvironmentInjector,
    private readonly focusTrapFactory: FocusTrapFactory,
  ) {}

  open<Component, Data = unknown, Result = unknown>(
    component: Type<Component>,
    config: DialogConfig<Data> = {},
  ): DialogRef<Result> {
    const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'atlas-dialog-backdrop',
      panelClass: 'atlas-dialog-panel',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: config.width ?? 'min(42rem, calc(100vw - 2rem))',
      maxHeight: 'min(52rem, calc(100dvh - 2rem))',
    })
    const dialogRef = new DialogRef<Result>(overlayRef, previouslyFocusedElement)
    const injector = Injector.create({
      parent: config.injector ?? this.environmentInjector,
      providers: [
        {provide: DIALOG_DATA, useValue: config.data},
        {provide: DialogRef, useValue: dialogRef},
      ],
    })

    overlayRef.attach(new ComponentPortal(component, null, injector))
    const focusTrap = this.focusTrapFactory.create(overlayRef.overlayElement)
    void focusTrap.focusInitialElementWhenReady()

    if (config.closeOnBackdrop !== false) {
      overlayRef.backdropClick().subscribe(() => dialogRef.close())
    }
    overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') dialogRef.close()
    })
    dialogRef.afterClosed.subscribe(() => focusTrap.destroy())

    return dialogRef
  }
}
