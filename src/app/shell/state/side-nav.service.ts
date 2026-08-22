import {Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class SideNavService {
  private readonly openState = signal(false)

  readonly isOpen = this.openState.asReadonly()

  public open(): void {
    this.openState.set(true)
  }

  public close(): void {
    this.openState.set(false)
  }

  public toggle(): void {
    this.openState.update(isOpen => !isOpen)
  }
}
