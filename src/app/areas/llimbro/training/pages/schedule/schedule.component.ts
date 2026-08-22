import {ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, linkedSignal, signal, viewChild} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {BadgeComponent, BadgeConfig} from '@shared/ui/badge'
import {ConfirmDialogService} from '@shared/ui/confirm-dialog'
import {DataListComponent, DataListConfig, DataListItem} from '@shared/ui/data-list'
import {ToastService} from '@shared/ui/toast'
import {
  SortableHandleDirective,
  SortableItemDirective,
  SortableListDirective,
  SortableMove,
} from '@shared/ui/sortable-list'
import {firstValueFrom} from 'rxjs'
import {RepetitionsInputComponent} from '../../ui/repetitions-input/repetitions-input.component'
import {
  TrainingExerciseListItem,
  TrainingScheduleCatalogDraftItem,
  TrainingScheduleDraft,
} from '../../models/training.models'
import {TrainingStore} from '../../state/training.store'
import {getIsoWeekday, TRAINING_WEEKDAYS} from '../../training.constants'

@Component({
  selector: 'app-schedule',
  imports: [
    FormsModule,
    BadgeComponent,
    DataListComponent,
    SortableListDirective,
    SortableItemDirective,
    SortableHandleDirective,
    RepetitionsInputComponent,
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ScheduleComponent {
  protected readonly store = inject(TrainingStore)
  private readonly confirmDialog = inject(ConfirmDialogService)
  private readonly toast = inject(ToastService)
  protected readonly weekdays = TRAINING_WEEKDAYS
  protected readonly selectedWeekday = signal(getIsoWeekday(new Date()))
  protected readonly selectingExercises = signal(false)
  protected readonly dirty = signal(false)
  protected readonly saveError = signal<string | null>(null)
  protected readonly catalogEditing = signal(false)
  protected readonly catalogDrafts = signal<TrainingScheduleCatalogDraftItem[]>([])
  protected readonly catalogSelectedKey = signal<string | null>(null)
  protected readonly catalogError = signal<string | null>(null)
  protected readonly shareUrl = signal<string | null>(null)
  protected readonly managingShares = signal(false)
  private readonly catalogInitialValue = signal('')
  private readonly multiSelection = signal(true)
  private readonly exerciseSelector = viewChild<ElementRef<HTMLElement>>('exerciseSelector')
  private readonly selectionScrollEffect = effect(() => {
    if (this.selectingExercises()) this.exerciseSelector()?.nativeElement.scrollIntoView({block: 'start'})
  })
  protected readonly drafts = linkedSignal<TrainingScheduleDraft[]>(() => this.dayDrafts())
  protected readonly selectedDayLabel = computed(() =>
    this.weekdays.find(day => day.id === this.selectedWeekday())?.label ?? '',
  )
  protected readonly visibleCatalogDrafts = computed(() => this.catalogDrafts().filter(draft => !draft.deleted))
  protected readonly selectedCatalogDraft = computed(() => this.visibleCatalogDrafts()
    .find(draft => draft.key === this.catalogSelectedKey()) ?? null)
  protected readonly selectedScheduleBadge = computed<BadgeConfig>(() => this.scheduleStatusBadge(
    this.store.selectedSchedule()?.is_active ?? false,
  ))
  protected readonly selectedCatalogDraftBadge = computed<BadgeConfig>(() => this.scheduleStatusBadge(
    this.selectedCatalogDraft()?.isActive ?? false,
  ))
  protected readonly catalogDirty = computed(() =>
    JSON.stringify(this.catalogDrafts()) !== this.catalogInitialValue(),
  )
  protected readonly catalogValid = computed(() => {
    const visible = this.visibleCatalogDrafts()
    const names = visible.map(draft => draft.name.trim().toLocaleLowerCase())
    return visible.length > 0
      && visible.filter(draft => draft.isActive).length === 1
      && names.every(Boolean)
      && new Set(names).size === names.length
      && visible.some(draft => draft.key === this.catalogSelectedKey())
  })
  protected readonly exerciseItems = computed<readonly DataListItem<TrainingExerciseListItem>[]>(() => {
    const assigned = new Set(this.drafts().map(draft => draft.exerciseId))
    return this.store.exercises().filter(exercise => !assigned.has(exercise.id)).map(exercise => ({
      id: exercise.id,
      value: exercise,
      title: exercise.name,
      details: exercise.description ? [exercise.description] : undefined,
      imageUrl: exercise.imageUrl,
    }))
  })
  protected readonly exerciseListConfig: DataListConfig<TrainingExerciseListItem> = {
    label: 'Ejercicios disponibles',
    actions: {confirm: exercises => this.addExercises(exercises)},
    multiple: this.multiSelection,
    showSelectionConfirmation: true,
    confirmationIcon: 'add',
    loading: this.store.loadingExercises,
  }

  protected selectWeekday(weekday: number): void {
    void this.changeWeekday(weekday)
  }

  protected toggleExerciseSelection(): void {
    this.selectingExercises.update(selecting => !selecting)
  }

  protected selectSchedule(event: Event): void {
    const select = event.target as HTMLSelectElement
    void this.changeSchedule(Number(select.value), select)
  }

  protected selectCatalogDraft(event: Event): void {
    this.catalogSelectedKey.set((event.target as HTMLSelectElement).value)
    this.catalogError.set(null)
  }

  protected beginCatalogEditing(): void {
    void this.openCatalogEditing()
  }

  protected cancelCatalogEditing(): void {
    this.catalogEditing.set(false)
    this.catalogDrafts.set([])
    this.catalogSelectedKey.set(null)
    this.catalogInitialValue.set('')
    this.catalogError.set(null)
    this.managingShares.set(false)
  }

  protected createScheduleDraft(): void {
    const key = `new:${crypto.randomUUID()}`
    this.catalogDrafts.update(drafts => [...drafts, {
      key,
      id: null,
      name: this.nextScheduleName('Horario', drafts),
      isActive: false,
      duplicateFromId: null,
      updatedAt: null,
      deleted: false,
    }])
    this.catalogSelectedKey.set(key)
    this.catalogError.set(null)
  }

  protected duplicateScheduleDraft(): void {
    const source = this.selectedCatalogDraft()
    if (!source?.id) return
    const key = `new:${crypto.randomUUID()}`
    this.catalogDrafts.update(drafts => [...drafts, {
      key,
      id: null,
      name: this.nextScheduleName(`${source.name.trim()} copia`, drafts),
      isActive: false,
      duplicateFromId: source.id,
      updatedAt: null,
      deleted: false,
    }])
    this.catalogSelectedKey.set(key)
    this.catalogError.set(null)
  }

  protected deleteScheduleDraft(): void {
    const selected = this.selectedCatalogDraft()
    if (!selected) return
    const remaining = this.visibleCatalogDrafts().filter(draft => draft.key !== selected.key)
    if (!remaining.length) {
      this.catalogError.set('El catálogo necesita al menos un horario.')
      return
    }
    const replacement = remaining[0]
    this.catalogDrafts.update(drafts => selected.id === null
      ? drafts.filter(draft => draft.key !== selected.key)
      : drafts.map(draft => draft.key === selected.key ? {...draft, deleted: true, isActive: false} : draft))
    if (selected.isActive) this.activateCatalogDraft(replacement.key)
    this.catalogSelectedKey.set(replacement.key)
    this.catalogError.set(null)
  }

  protected activateCatalogDraft(key = this.catalogSelectedKey()): void {
    if (!key) return
    this.catalogDrafts.update(drafts => drafts.map(draft => ({
      ...draft,
      isActive: !draft.deleted && draft.key === key,
    })))
    this.catalogError.set(null)
  }

  protected updateCatalogName(event: Event): void {
    const key = this.catalogSelectedKey()
    if (!key) return
    const name = (event.target as HTMLInputElement).value
    this.catalogDrafts.update(drafts => drafts.map(draft => draft.key === key ? {...draft, name} : draft))
    this.catalogError.set(null)
  }

  protected async saveCatalog(): Promise<void> {
    if (!this.catalogValid()) {
      this.catalogError.set('Revisa los nombres y asegúrate de que haya un único horario activo.')
      return
    }
    const selectedKey = this.catalogSelectedKey()
    if (!selectedKey) return
    this.catalogError.set(null)
    try {
      await this.store.saveScheduleCatalog(this.catalogDrafts(), selectedKey)
      this.cancelCatalogEditing()
      this.toast.success('Catálogo guardado', {description: 'Los horarios ya están actualizados.'})
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const description = message.includes('stale_training_schedule_catalog')
        ? 'El catálogo cambió en otra sesión. Cancela y vuelve a abrir la edición para recargarlo.'
        : 'No se han guardado los cambios. Revisa los nombres e inténtalo de nuevo.'
      this.catalogError.set(description)
      this.toast.error('No se pudo guardar el catálogo', {description})
    }
  }

  protected async shareSchedule(): Promise<void> {
    if (this.dirty() || this.catalogEditing()) {
      this.catalogError.set('Guarda o cancela los cambios antes de crear un enlace.')
      return
    }
    this.catalogError.set(null)
    try {
      const share = await this.store.shareSelectedSchedule()
      const url = new URL(`/share/training/${share.token}`, globalThis.location.origin).toString()
      this.shareUrl.set(url)
      await this.copyShareUrl(url)
    } catch {
      this.catalogError.set('No se ha podido crear el enlace compartido.')
    }
  }

  protected async copyShareUrl(url = this.shareUrl()): Promise<void> {
    if (!url) return
    try {
      await globalThis.navigator.clipboard.writeText(url)
    } catch {
      this.catalogError.set('Copia el enlace manualmente desde el campo.')
    }
  }

  protected revokeShare(shareId: string): void {
    this.confirmDialog.open({
      title: 'Revocar enlace',
      message: 'El enlace dejará de funcionar. Las copias ya importadas no se modificarán.',
      acceptButton: {text: 'Revocar', show: true, intent: 'danger'},
    }).subscribe(confirmed => {
      if (confirmed) void this.store.revokeShare(shareId)
    })
  }

  protected removeExercise(index: number): void {
    this.drafts.update(drafts => this.normalizeOrder(drafts.filter((_, draftIndex) => draftIndex !== index)))
    this.markDayDirty()
  }

  protected updateNumber(
    index: number,
    field: 'setCount' | 'targetRepetitions' | 'targetWeightKg',
    event: Event,
  ): void {
    const raw = (event.target as HTMLInputElement).value
    const parsed = raw === '' ? null : Number(raw)
    const value = field === 'targetWeightKg'
      ? parsed === null ? null : Math.max(0, parsed)
      : parsed === null ? null : Math.max(1, Math.trunc(parsed))
    this.updateDraftNumber(index, field, field === 'setCount' ? value ?? 1 : value)
  }

  protected setRepetitions(index: number, repetitions: number | null): void {
    this.updateDraftNumber(index, 'targetRepetitions', repetitions)
  }

  protected reorder(move: SortableMove): void {
    this.drafts.update(drafts => {
      const reordered = [...drafts]
      const [moved] = reordered.splice(move.previousIndex, 1)
      if (!moved) return drafts
      reordered.splice(move.currentIndex, 0, moved)
      return this.normalizeOrder(reordered)
    })
    this.markDayDirty()
  }

  protected exerciseName(exerciseId: number): string {
    return this.store.exercises().find(exercise => exercise.id === exerciseId)?.name ?? 'Ejercicio'
  }

  protected exercisePositionBadge(position: number): BadgeConfig {
    return {variant: 'count', value: position, ariaLabel: `Ejercicio ${position}`}
  }

  protected async save(): Promise<void> {
    this.saveError.set(null)
    try {
      await this.store.saveScheduleDay(this.selectedWeekday(), this.drafts())
      this.dirty.set(false)
      this.toast.success('Horario guardado', {description: 'Tus cambios ya están al día.'})
    } catch {
      const description = 'Inténtalo de nuevo dentro de unos segundos.'
      this.saveError.set('No se ha podido guardar el horario. Inténtalo de nuevo.')
      this.toast.error('No se pudo guardar el horario', {description})
    }
  }

  private async changeWeekday(weekday: number): Promise<void> {
    if (weekday === this.selectedWeekday()) return
    if (this.dirty() && !await this.confirmDayDiscard()) return
    this.dirty.set(false)
    this.selectedWeekday.set(weekday)
    this.selectingExercises.set(false)
    this.saveError.set(null)
  }

  private async changeSchedule(scheduleId: number, select: HTMLSelectElement): Promise<void> {
    if (scheduleId === this.store.selectedScheduleId()) return
    if (this.dirty() && !await this.confirmDayDiscard()) {
      select.value = String(this.store.selectedScheduleId() ?? '')
      return
    }
    this.dirty.set(false)
    this.store.selectSchedule(scheduleId)
    this.selectingExercises.set(false)
    this.saveError.set(null)
    this.catalogError.set(null)
  }

  private async openCatalogEditing(): Promise<void> {
    const discardingDay = this.dirty()
    if (discardingDay && !await this.confirmDayDiscard()) return
    if (discardingDay) this.drafts.set(this.dayDrafts())
    this.dirty.set(false)
    this.selectingExercises.set(false)
    const drafts = this.store.schedules().map(schedule => ({
      key: `schedule:${schedule.id}`,
      id: schedule.id,
      name: schedule.name,
      isActive: schedule.is_active,
      duplicateFromId: null,
      updatedAt: schedule.updated_at,
      deleted: false,
    } satisfies TrainingScheduleCatalogDraftItem))
    this.catalogDrafts.set(drafts)
    this.catalogInitialValue.set(JSON.stringify(drafts))
    const selectedId = this.store.selectedScheduleId()
    this.catalogSelectedKey.set(`schedule:${selectedId ?? drafts[0]?.id}`)
    this.catalogEditing.set(true)
    this.catalogError.set(null)
  }

  private async confirmDayDiscard(): Promise<boolean> {
    if (!this.dirty()) return true
    return firstValueFrom(this.confirmDialog.open({
      title: 'Cambios sin guardar',
      message: 'Si continúas, se descartarán los cambios del día seleccionado.',
      acceptButton: {text: 'Descartar y continuar', show: true, intent: 'danger'},
      cancelButton: {text: 'Seguir editando', show: true},
    }))
  }

  private addExercises(exercises: readonly TrainingExerciseListItem[]): void {
    this.drafts.update(drafts => [
      ...drafts,
      ...exercises.map((exercise, offset) => ({
        exerciseId: exercise.id,
        setCount: 1,
        targetRepetitions: 12,
        targetWeightKg: null,
        sortOrder: drafts.length + offset,
      })),
    ])
    this.selectingExercises.set(false)
    this.markDayDirty()
  }

  private dayDrafts(): TrainingScheduleDraft[] {
    return this.store.selectedScheduleItems()
      .filter(item => item.weekday === this.selectedWeekday())
      .map(item => ({
        id: item.id,
        exerciseId: item.exercise_id,
        setCount: item.set_count,
        targetRepetitions: item.target_repetitions,
        targetWeightKg: item.target_weight_kg,
        sortOrder: item.sort_order,
      }))
  }

  private updateDraftNumber(
    index: number,
    field: 'setCount' | 'targetRepetitions' | 'targetWeightKg',
    value: number | null,
  ): void {
    this.drafts.update(drafts => drafts.map((draft, draftIndex) => draftIndex === index
      ? {...draft, [field]: value}
      : draft))
    this.markDayDirty()
  }

  private normalizeOrder(drafts: readonly TrainingScheduleDraft[]): TrainingScheduleDraft[] {
    return drafts.map((draft, sortOrder) => ({...draft, sortOrder}))
  }

  private markDayDirty(): void {
    this.dirty.set(true)
    this.saveError.set(null)
  }

  private scheduleStatusBadge(active: boolean): BadgeConfig {
    return {
      variant: 'label',
      label: active ? 'Activo en Seguimiento' : 'No activo',
      status: active ? 'primary' : 'neutral',
    }
  }

  private nextScheduleName(base: string, drafts: readonly TrainingScheduleCatalogDraftItem[]): string {
    const names = new Set(drafts.filter(draft => !draft.deleted)
      .map(draft => draft.name.trim().toLocaleLowerCase()))
    if (!names.has(base.toLocaleLowerCase())) return base
    let suffix = 2
    while (names.has(`${base} ${suffix}`.toLocaleLowerCase())) suffix += 1
    return `${base} ${suffix}`
  }
}
