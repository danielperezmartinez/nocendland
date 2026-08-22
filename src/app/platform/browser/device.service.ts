import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private readonly isMobileState = signal(false)
  readonly isMobile = this.isMobileState.asReadonly()

  constructor() {
    this.checkIfIsMobile()
    window.addEventListener('resize', this.checkIfIsMobile.bind(this))
  }

  // TODO: PONER ALGÚN TIPO DE EJECUCIONES CONTROLADAS DEBOUNCE NO ME SIRVE
  private checkIfIsMobile(): void {
    this.isMobileState.set(window.innerWidth < 600);
  }
}
