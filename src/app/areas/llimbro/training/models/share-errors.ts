/** Códigos públicos que devuelve la Edge Function training-share. */
export type TrainingShareErrorCode =
  | 'invalid_request'
  | 'authentication_required'
  | 'share_not_found'
  | 'schedule_not_found'
  | 'invalid_exercise_selection'
  | 'schedule_already_imported'
  | 'share_limit_reached'
  | 'row_limit_exceeded'
  | 'rate_limited'
  | 'training_share_failed'

const SHARE_ERROR_MESSAGES: Partial<Record<TrainingShareErrorCode, string>> = {
  share_not_found: 'Este enlace no existe o ha sido revocado.',
  schedule_already_imported: 'Este horario ya está en tu catálogo.',
  share_limit_reached: 'Ya tienes 20 enlaces activos. Revoca alguno para crear otro.',
  row_limit_exceeded: 'Has alcanzado el máximo de ejercicios u horarios de tu cuenta.',
  rate_limited: 'Este enlace ha recibido demasiadas visitas. Inténtalo de nuevo dentro de un rato.',
}

/** Error con el código público de training-share, sin detalles internos. */
export class TrainingShareError extends Error {
  constructor(readonly code: TrainingShareErrorCode) {
    super(code)
    this.name = 'TrainingShareError'
  }
}

/** Devuelve el mensaje visible para un error de compartir o el texto genérico indicado. */
export function describeTrainingShareError(error: unknown, fallback: string): string {
  if (!(error instanceof TrainingShareError)) return fallback
  return SHARE_ERROR_MESSAGES[error.code] ?? fallback
}
