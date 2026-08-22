import {ActivatedRouteSnapshot, Params} from '@angular/router'

export type ExerciseRouteOrigin = 'exercises' | 'tracking'

export interface ExerciseRouteContext {
  origin: ExerciseRouteOrigin
  date: string | null
}

export function readExerciseRouteContext(snapshot: ActivatedRouteSnapshot): ExerciseRouteContext {
  const origin = snapshot.queryParamMap.get('from') === 'tracking' ? 'tracking' : 'exercises'
  const date = parseExerciseRouteDate(snapshot.queryParamMap.get('date'))
  return {origin, date: date ? formatExerciseRouteDate(date) : null}
}

export function exerciseRouteQueryParams(context: ExerciseRouteContext): Params {
  return context.origin === 'tracking' && context.date
    ? {from: 'tracking', date: context.date}
    : {from: 'exercises'}
}

export function parseExerciseRouteDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export function formatExerciseRouteDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
