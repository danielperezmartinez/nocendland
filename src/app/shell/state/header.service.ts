import {Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class HeaderService {
  private readonly titleState = signal('NOCENDLAND')

  readonly title = this.titleState.asReadonly()

  public setTitle(title: string): void {
    this.titleState.set(title)
  }
}
