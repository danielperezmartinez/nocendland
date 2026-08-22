import {Injectable, signal} from '@angular/core'
import {ToastKind, ToastMessage, ToastOptions} from './toast.types'

interface ToastTimer {
  handle: ReturnType<typeof setTimeout>
  remainingMs: number
  startedAt: number
}

@Injectable({providedIn: 'root'})
export class ToastService {
  private readonly messagesState = signal<readonly ToastMessage[]>([])
  private readonly timers = new Map<string, ToastTimer>()
  private nextId = 0

  readonly messages = this.messagesState.asReadonly()

  success(title: string, options: ToastOptions = {}): string {
    return this.show('success', title, options)
  }

  error(title: string, options: ToastOptions = {}): string {
    return this.show('error', title, options)
  }

  dismiss(id: string): void {
    this.clearTimer(id)
    this.messagesState.update(messages => messages.filter(message => message.id !== id))
  }

  pause(id: string): void {
    const timer = this.timers.get(id)
    if (!timer) return
    clearTimeout(timer.handle)
    this.timers.set(id, {
      ...timer,
      remainingMs: Math.max(0, timer.remainingMs - (Date.now() - timer.startedAt)),
    })
  }

  resume(id: string): void {
    const timer = this.timers.get(id)
    if (!timer) return
    this.scheduleDismissal(id, timer.remainingMs)
  }

  private show(kind: ToastKind, title: string, options: ToastOptions): string {
    const id = `toast-${Date.now()}-${++this.nextId}`
    const durationMs = options.durationMs ?? (kind === 'error' ? 6000 : 4000)
    const message: ToastMessage = {id, kind, title, description: options.description, durationMs}
    const previousMessages = this.messagesState()
    const removedMessages = previousMessages.slice(0, Math.max(0, previousMessages.length - 2))
    removedMessages.forEach(removed => this.clearTimer(removed.id))
    this.messagesState.set([...previousMessages.slice(-2), message])
    this.scheduleDismissal(id, durationMs)
    return id
  }

  private scheduleDismissal(id: string, durationMs: number): void {
    this.clearTimer(id)
    if (durationMs <= 0) {
      this.dismiss(id)
      return
    }
    const handle = setTimeout(() => this.dismiss(id), durationMs)
    this.timers.set(id, {handle, remainingMs: durationMs, startedAt: Date.now()})
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id)
    if (timer) clearTimeout(timer.handle)
    this.timers.delete(id)
  }
}
