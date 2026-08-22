import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core'
import {ToastService} from './toast.service'

@Component({
  selector: 'app-toast-outlet',
  templateUrl: './toast-outlet.component.html',
  styleUrl: './toast-outlet.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ToastOutletComponent {
  protected readonly toastService = inject(ToastService)
  protected readonly pauseCounts = signal<ReadonlyMap<string, number>>(new Map())

  protected pause(id: string): void {
    const currentCount = this.pauseCounts().get(id) ?? 0
    this.pauseCounts.update(counts => new Map(counts).set(id, currentCount + 1))
    if (currentCount === 0) this.toastService.pause(id)
  }

  protected resume(id: string): void {
    const currentCount = this.pauseCounts().get(id) ?? 0
    if (currentCount === 0) return
    this.pauseCounts.update(counts => {
      const next = new Map(counts)
      if (currentCount === 1) next.delete(id)
      else next.set(id, currentCount - 1)
      return next
    })
    if (currentCount === 1) this.toastService.resume(id)
  }

  protected handleFocusOut(id: string, event: FocusEvent): void {
    const outlet = event.currentTarget as HTMLElement
    if (!outlet.contains(event.relatedTarget as Node | null)) this.resume(id)
  }

  protected dismiss(id: string): void {
    this.pauseCounts.update(counts => {
      const next = new Map(counts)
      next.delete(id)
      return next
    })
    this.toastService.dismiss(id)
  }
}
