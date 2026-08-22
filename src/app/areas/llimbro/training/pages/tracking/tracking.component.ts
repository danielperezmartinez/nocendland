import {ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal} from '@angular/core'
import {ActivatedRoute} from '@angular/router'
import {NavigationService} from '@shell/navigation/navigation.service'
import {BadgeComponent, BadgeConfig} from '@shared/ui/badge'
import {CalendarComponent} from '@shared/ui/calendar'
import {DataListComponent, DataListConfig, DataListItem} from '@shared/ui/data-list'
import {ToastService} from '@shared/ui/toast'
import {TooltipDirective} from '@shared/ui/tooltip'
import {formatDateForDisplay} from '@shared/utilities/date.utils'
import {formatExerciseRouteDate, parseExerciseRouteDate} from '../../exercise-route-context'
import {TrainingPendingChanges} from '../../pending-changes.guard'
import {TrainingEntryDraft, TrainingExerciseListItem, TrainingSet, TrainingSetDraft} from '../../models/training.models'
import {TrainingStore} from '../../state/training.store'
import {getIsoWeekday} from '../../training.constants'
import {
  analyzeLoadProgression,
  LoadProgressionRecommendation,
} from './load-progression-analysis'

type EditableSet = TrainingSetDraft & {clientId: string}
type EditableEntry = Omit<TrainingEntryDraft, 'sets'> & {clientId: string; sets: EditableSet[]}

@Component({
  selector: 'app-tracking',
  imports: [BadgeComponent, CalendarComponent, DataListComponent, TooltipDirective],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TrackingComponent implements TrainingPendingChanges {
  protected readonly store = inject(TrainingStore)
  private readonly route = inject(ActivatedRoute)
  private readonly navigation = inject(NavigationService)
  private readonly toast = inject(ToastService)
  protected readonly selectingExercises = signal(false)
  protected readonly dirty = signal(false)
  private readonly multiSelection = signal(true)
  protected readonly drafts = linkedSignal<
    {date: Date; entries: ReturnType<TrainingStore['entries']>},
    EditableEntry[]
  >({
    source: () => ({date: this.store.selectedDate(), entries: this.store.entries()}),
    computation: ({entries}) => entries.map(entry => ({
      id: entry.id,
      clientId: `entry-${entry.id}`,
      exerciseId: entry.exercise_id,
      sortOrder: entry.sort_order,
      sets: entry.training_set.map(set => ({
        id: set.id,
        clientId: `set-${set.id}`,
        position: set.position,
        repetitions: set.repetitions,
        weightKg: set.weight_kg,
      })),
    })),
  })
  protected readonly availableExercises = computed<TrainingExerciseListItem[]>(() => {
    const registered = new Set(this.drafts().map(entry => entry.exerciseId))
    return this.store.exercises().filter(exercise => !registered.has(exercise.id))
  })
  protected readonly exerciseItems = computed<readonly DataListItem<TrainingExerciseListItem>[]>(() =>
    this.availableExercises().map(exercise => ({
      id: exercise.id,
      value: exercise,
      title: exercise.name,
      details: exercise.description ? [exercise.description] : undefined,
      imageUrl: exercise.imageUrl,
    })),
  )
  protected readonly plannedSelectionIds = computed<readonly number[]>(() => {
    const available = new Set(this.availableExercises().map(exercise => exercise.id))
    const weekday = getIsoWeekday(this.store.selectedDate())
    return this.store.schedule().filter(item => item.weekday === weekday && available.has(item.exercise_id))
      .map(item => item.exercise_id)
  })
  protected readonly loadProgressionRecommendations = computed<ReadonlyMap<number, LoadProgressionRecommendation>>(() => {
    const weekday = getIsoWeekday(this.store.selectedDate())
    const recommendations = new Map<number, LoadProgressionRecommendation>()
    for (const entry of this.drafts()) {
      const planned = this.store.schedule().find(item =>
        item.weekday === weekday && item.exercise_id === entry.exerciseId)
      const recommendation = analyzeLoadProgression(planned ? {
        setCount: planned.set_count,
        targetRepetitions: planned.target_repetitions,
        targetWeightKg: planned.target_weight_kg,
      } : null, this.store.recentSessions().get(entry.exerciseId) ?? [])
      if (recommendation) recommendations.set(entry.exerciseId, recommendation)
    }
    return recommendations
  })
  protected readonly exerciseListConfig: DataListConfig<TrainingExerciseListItem> = {
    label: 'Ejercicios disponibles',
    actions: {confirm: exercises => this.addEntries(exercises)},
    multiple: this.multiSelection,
    showSelectionConfirmation: true,
    confirmationIcon: 'add',
    loading: this.store.loadingExercises,
    initialSelectedIds: this.plannedSelectionIds,
  }

  constructor() {
    const selectedDate = parseExerciseRouteDate(this.route.snapshot.queryParamMap.get('date'))
    if (selectedDate) this.store.selectDate(selectedDate)
  }

  hasPendingChanges(): boolean {
    return this.dirty()
  }

  protected selectDate(date: Date): void {
    this.store.selectDate(date)
    this.selectingExercises.set(false)
    this.dirty.set(false)
  }

  protected exerciseName(exerciseId: number): string {
    return this.store.exercises().find(exercise => exercise.id === exerciseId)?.name
      ?? this.store.entries().find(entry => entry.exercise_id === exerciseId)?.training_exercise.name
      ?? 'Ejercicio'
  }

  protected openExercise(exerciseId: number): void {
    const date = formatExerciseRouteDate(this.store.selectedDate())
    void this.navigation.to('training', 'exercises', String(exerciseId), {
      queryParams: {from: 'tracking', date},
    })
  }

  protected addSet(entryIndex: number): void {
    this.drafts.update(entries => entries.map((entry, index) => index === entryIndex ? {
      ...entry,
      sets: [...entry.sets, this.newSet(entry.sets.length + 1, null, null)],
    } : entry))
    this.dirty.set(true)
  }

  protected removeSet(entryIndex: number, setIndex: number): void {
    this.drafts.update(entries => entries.map((entry, index) => index === entryIndex ? {
      ...entry,
      sets: entry.sets.filter((_, indexToRemove) => indexToRemove !== setIndex)
        .map((set, position) => ({...set, position: position + 1})),
    } : entry))
    this.dirty.set(true)
  }

  protected removeEntry(entryIndex: number): void {
    this.drafts.update(entries => entries.filter((_, index) => index !== entryIndex)
      .map((entry, sortOrder) => ({...entry, sortOrder})))
    this.dirty.set(true)
  }

  protected updateSet(entryIndex: number, setIndex: number, field: 'repetitions' | 'weightKg', event: Event): void {
    const raw = (event.target as HTMLInputElement).value
    const numericValue = Number(raw)
    const value = raw === '' ? null : field === 'repetitions'
      ? Math.max(1, Math.trunc(numericValue))
      : numericValue
    this.updateSetValue(entryIndex, setIndex, field, value)
  }

  protected async save(): Promise<void> {
    try {
      await this.store.saveEntries(this.drafts())
      this.dirty.set(false)
      this.toast.success('Seguimiento guardado', {description: 'La sesión ya está actualizada.'})
    } catch {
      this.toast.error('No se pudo guardar la sesión', {
        description: 'Conservamos tus cambios en pantalla para que puedas reintentarlo.',
      })
    }
  }

  protected readonly formatDateForDisplay = formatDateForDisplay

  protected formatPreviousDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  protected formatPreviousSet(set: TrainingSet): string {
    const repetitions = set.repetitions === null ? '— reps' : `${set.repetitions} reps`
    const weight = set.weight_kg === null ? 'sin peso' : `${this.formatNumber(set.weight_kg)} kg`
    return `${repetitions} × ${weight}`
  }

  protected setPositionBadge(position: number): BadgeConfig {
    return {variant: 'count', value: position, ariaLabel: `Serie ${position}`}
  }

  protected formatLoadProgressionTooltip(recommendation: LoadProgressionRecommendation): string {
    return `Puedes subir peso. Cumpliste ${recommendation.setCount} series de ${recommendation.targetRepetitions} repeticiones o más, desde ${this.formatNumber(recommendation.targetWeightKg)} kg, en tus dos últimas sesiones sin reducir la carga.`
  }

  private addEntries(exercises: readonly TrainingExerciseListItem[]): void {
    const weekday = getIsoWeekday(this.store.selectedDate())
    this.drafts.update(entries => [
      ...entries,
      ...exercises.map((exercise, offset) => {
        const planned = this.store.schedule().find(item => item.weekday === weekday && item.exercise_id === exercise.id)
        const setCount = planned?.set_count ?? 1
        return {
          clientId: crypto.randomUUID(),
          exerciseId: exercise.id,
          sortOrder: entries.length + offset,
          sets: Array.from({length: setCount}, (_, index) => this.newSet(
            index + 1,
            planned?.target_repetitions ?? null,
            planned?.target_weight_kg ?? null,
          )),
        }
      }),
    ])
    this.selectingExercises.set(false)
    this.dirty.set(true)
    void this.store.loadPreviousSessions(exercises.map(exercise => exercise.id))
  }

  private newSet(position: number, repetitions: number | null, weightKg: number | null): EditableSet {
    return {clientId: crypto.randomUUID(), position, repetitions, weightKg}
  }

  private updateSetValue(
    entryIndex: number,
    setIndex: number,
    field: 'repetitions' | 'weightKg',
    value: number | null,
  ): void {
    this.drafts.update(entries => entries.map((entry, index) => index === entryIndex ? {
      ...entry,
      sets: entry.sets.map((set, indexOfSet) => indexOfSet === setIndex ? {...set, [field]: value} : set),
    } : entry))
    this.dirty.set(true)
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES', {maximumFractionDigits: 2}).format(value)
  }
}
