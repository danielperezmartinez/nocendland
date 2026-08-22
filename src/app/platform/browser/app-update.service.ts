import {DOCUMENT} from '@angular/common'
import {DestroyRef, Injectable, inject, signal} from '@angular/core'
import {SwUpdate} from '@angular/service-worker'
import {takeUntilDestroyed} from '@angular/core/rxjs-interop'

const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

@Injectable({providedIn: 'root'})
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate, {optional: true})
  private readonly document = inject(DOCUMENT)
  private readonly destroyRef = inject(DestroyRef)
  private readonly updateAvailableState = signal(false)
  private readonly checkingState = signal(false)

  readonly updateAvailable = this.updateAvailableState.asReadonly()
  readonly checking = this.checkingState.asReadonly()

  constructor() {
    if (!this.swUpdate?.isEnabled) return

    this.swUpdate.versionUpdates
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.type === 'VERSION_READY') this.updateAvailableState.set(true)
        if (event.type === 'VERSION_INSTALLATION_FAILED') {
          console.error('No se ha podido instalar la nueva versión de la aplicación.', event.error)
        }
      })

    const view = this.document.defaultView
    if (!view) return

    const checkWhenVisible = (): void => {
      if (this.document.visibilityState === 'visible') void this.checkForUpdate()
    }
    const intervalId = view.setInterval(() => void this.checkForUpdate(), UPDATE_CHECK_INTERVAL_MS)

    this.document.addEventListener('visibilitychange', checkWhenVisible)
    this.destroyRef.onDestroy(() => {
      view.clearInterval(intervalId)
      this.document.removeEventListener('visibilitychange', checkWhenVisible)
    })

    void this.checkForUpdate()
  }

  dismiss(): void {
    this.updateAvailableState.set(false)
  }

  reload(): void {
    this.document.defaultView?.location.reload()
  }

  async checkForUpdate(): Promise<void> {
    if (!this.swUpdate || this.checkingState()) return

    this.checkingState.set(true)
    try {
      await this.swUpdate.checkForUpdate()
    } catch {
      // La ausencia de conexión no debe interrumpir el uso offline de la PWA.
    } finally {
      this.checkingState.set(false)
    }
  }
}
