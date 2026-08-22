export const TRAINING_WEEKDAYS = [
  {id: 1, shortLabel: 'Lun', label: 'Lunes'},
  {id: 2, shortLabel: 'Mar', label: 'Martes'},
  {id: 3, shortLabel: 'Mié', label: 'Miércoles'},
  {id: 4, shortLabel: 'Jue', label: 'Jueves'},
  {id: 5, shortLabel: 'Vie', label: 'Viernes'},
  {id: 6, shortLabel: 'Sáb', label: 'Sábado'},
  {id: 7, shortLabel: 'Dom', label: 'Domingo'},
] as const

export const TRAINING_MODALITIES = [
  {id: 'strength', label: 'Fuerza'},
  {id: 'cardio', label: 'Cardio'},
  {id: 'power_plyometrics', label: 'Potencia / pliometría'},
  {id: 'mobility', label: 'Movilidad'},
  {id: 'flexibility', label: 'Flexibilidad'},
  {id: 'balance_stability', label: 'Equilibrio / estabilidad'},
] as const

export const TRAINING_MUSCLE_GROUPS = [
  {id: 'full_body', label: 'Cuerpo completo'},
  {id: 'chest', label: 'Pecho'},
  {id: 'back', label: 'Espalda'},
  {id: 'shoulders', label: 'Hombros'},
  {id: 'biceps', label: 'Bíceps'},
  {id: 'triceps', label: 'Tríceps'},
  {id: 'forearms_grip', label: 'Antebrazos / agarre'},
  {id: 'core_abs', label: 'Core / abdomen'},
  {id: 'glutes_hips', label: 'Glúteos / cadera'},
  {id: 'quadriceps', label: 'Cuádriceps'},
  {id: 'hamstrings', label: 'Isquiotibiales'},
  {id: 'calves', label: 'Gemelos / pantorrillas'},
] as const

export const TRAINING_MOVEMENT_PATTERNS = [
  {id: 'push', label: 'Empuje'},
  {id: 'pull', label: 'Tirón'},
  {id: 'squat', label: 'Sentadilla'},
  {id: 'hip_hinge', label: 'Bisagra de cadera'},
  {id: 'lunge_unilateral', label: 'Zancada / unilateral'},
  {id: 'rotation', label: 'Rotación'},
  {id: 'anti_rotation_core_stability', label: 'Antirotación / estabilidad del core'},
  {id: 'loaded_carry', label: 'Transporte de carga'},
  {id: 'locomotion', label: 'Locomoción'},
  {id: 'jump', label: 'Salto'},
  {id: 'isolation', label: 'Aislamiento'},
] as const

export type TrainingModality = typeof TRAINING_MODALITIES[number]['id']
export type TrainingMuscleGroup = typeof TRAINING_MUSCLE_GROUPS[number]['id']
export type TrainingMovementPattern = typeof TRAINING_MOVEMENT_PATTERNS[number]['id']

export function trainingTaxonomyLabels(values: readonly string[]): string[] {
  const labels = new Map([
    ...TRAINING_MODALITIES,
    ...TRAINING_MUSCLE_GROUPS,
    ...TRAINING_MOVEMENT_PATTERNS,
  ].map(option => [option.id as string, option.label]))
  return values.map(value => labels.get(value) ?? value)
}

export function getIsoWeekday(date: Date): number {
  return date.getDay() || 7
}
