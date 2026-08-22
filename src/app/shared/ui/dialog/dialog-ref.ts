import {OverlayRef} from '@angular/cdk/overlay'
import {Observable, ReplaySubject} from 'rxjs'

export class DialogRef<Result = unknown> {
  private readonly closedState = new ReplaySubject<Result | undefined>(1)
  private closed = false

  readonly afterClosed: Observable<Result | undefined> = this.closedState.asObservable()

  constructor(
    private readonly overlayRef: OverlayRef,
    private readonly previouslyFocusedElement: HTMLElement | null,
  ) {}

  close(result?: Result): void {
    if (this.closed) return

    this.closed = true
    this.overlayRef.dispose()
    this.closedState.next(result)
    this.closedState.complete()
    setTimeout(() => this.previouslyFocusedElement?.focus())
  }
}
