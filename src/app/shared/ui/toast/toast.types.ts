export type ToastKind = 'success' | 'error'

export interface ToastMessage {
  readonly id: string
  readonly kind: ToastKind
  readonly title: string
  readonly description?: string
  readonly durationMs: number
}

export interface ToastOptions {
  readonly description?: string
  readonly durationMs?: number
}
