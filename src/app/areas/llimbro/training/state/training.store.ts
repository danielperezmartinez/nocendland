import {computed, effect, Injectable, linkedSignal, OnDestroy, signal} from '@angular/core'
import {formatDateForDatabase} from '@shared/utilities/date.utils'
import {ExerciseRepository} from '../data-access/exercise.repository'
import {ScheduleRepository} from '../data-access/schedule.repository'
import {ShareRepository} from '../data-access/share.repository'
import {TrackingRepository} from '../data-access/tracking.repository'
import {
  TrainingEntryDraft,
  TrainingEntryWithDetails,
  TrainingExercise,
  TrainingExerciseDraft,
  TrainingExerciseHistoryEntry,
  TrainingExerciseListItem,
  TrainingScheduleDraft,
  TrainingScheduleCatalogDraftItem,
  TrainingSchedule,
  TrainingScheduleItemWithExercise,
  TrainingShare,
  TrainingShareCreated,
} from '../models/training.models'

@Injectable()
export class TrainingStore implements OnDestroy {
  private readonly exercisesState = signal<TrainingExerciseListItem[]>([])
  private readonly schedulesState = signal<TrainingSchedule[]>([])
  private readonly scheduleItemsState = signal<TrainingScheduleItemWithExercise[]>([])
  private readonly entriesState = signal<TrainingEntryWithDetails[]>([])
  private readonly recentSessionsState = signal<ReadonlyMap<number, readonly TrainingExerciseHistoryEntry[]>>(new Map())
  private readonly exerciseDetailState = signal<TrainingExerciseListItem | null>(null)
  private readonly exerciseHistoryState = signal<TrainingExerciseHistoryEntry[]>([])
  private readonly selectedDateState = signal(new Date())
  private readonly loadingExercisesState = signal(false)
  private readonly loadingScheduleState = signal(false)
  private readonly loadingEntriesState = signal(false)
  private readonly loadingExerciseDetailState = signal(false)
  private readonly exerciseDetailErrorState = signal<string | null>(null)
  private readonly savingScheduleState = signal(false)
  private readonly savingScheduleCatalogState = signal(false)
  private readonly savingEntriesState = signal(false)
  private readonly sharingState = signal(false)
  private readonly sharesState = signal<TrainingShare[]>([])
  private readonly recentSessionRequests = new Map<string, Promise<void>>()
  private readonly selectedScheduleIdState = linkedSignal<TrainingSchedule[], number | null>({
    source: () => this.schedulesState(),
    computation: (schedules, previous) => {
      const previousId = previous?.value
      if (previousId && schedules.some(schedule => schedule.id === previousId)) return previousId
      return schedules.find(schedule => schedule.is_active)?.id ?? schedules[0]?.id ?? null
    },
  })

  readonly exercises = this.exercisesState.asReadonly()
  readonly schedules = this.schedulesState.asReadonly()
  readonly selectedScheduleId = this.selectedScheduleIdState.asReadonly()
  readonly selectedSchedule = computed(() => this.schedulesState()
    .find(schedule => schedule.id === this.selectedScheduleIdState()) ?? null)
  readonly activeSchedule = computed(() => this.schedulesState().find(schedule => schedule.is_active) ?? null)
  readonly selectedScheduleItems = computed(() => this.scheduleItemsState()
    .filter(item => item.schedule_id === this.selectedScheduleIdState()))
  readonly schedule = computed(() => {
    const activeId = this.activeSchedule()?.id
    return activeId ? this.scheduleItemsState().filter(item => item.schedule_id === activeId) : []
  })
  readonly entries = this.entriesState.asReadonly()
  readonly recentSessions = this.recentSessionsState.asReadonly()
  readonly previousSessions = computed<ReadonlyMap<number, TrainingExerciseHistoryEntry | null>>(() => {
    const previous = new Map<number, TrainingExerciseHistoryEntry | null>()
    for (const [exerciseId, sessions] of this.recentSessionsState()) {
      previous.set(exerciseId, sessions[0] ?? null)
    }
    return previous
  })
  readonly exerciseDetail = this.exerciseDetailState.asReadonly()
  readonly exerciseHistory = this.exerciseHistoryState.asReadonly()
  readonly shares = this.sharesState.asReadonly()
  readonly selectedDate = this.selectedDateState.asReadonly()
  readonly loadingExercises = this.loadingExercisesState.asReadonly()
  readonly loadingSchedule = this.loadingScheduleState.asReadonly()
  readonly loadingEntries = this.loadingEntriesState.asReadonly()
  readonly loadingExerciseDetail = this.loadingExerciseDetailState.asReadonly()
  readonly exerciseDetailError = this.exerciseDetailErrorState.asReadonly()
  readonly savingSchedule = this.savingScheduleState.asReadonly()
  readonly savingScheduleCatalog = this.savingScheduleCatalogState.asReadonly()
  readonly savingEntries = this.savingEntriesState.asReadonly()
  readonly sharing = this.sharingState.asReadonly()
  readonly savingExercise: ExerciseRepository['saving']
  readonly savingExerciseImage: ExerciseRepository['savingImage']

  constructor(
    private readonly exercisesRepository: ExerciseRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly trackingRepository: TrackingRepository,
    private readonly shareRepository: ShareRepository,
  ) {
    this.savingExercise = this.exercisesRepository.saving
    this.savingExerciseImage = this.exercisesRepository.savingImage
    void Promise.all([this.loadExercises(), this.initializeSchedules(), this.loadShares()])
    effect(() => void this.loadEntries(this.selectedDateState()))
  }

  async loadExercises(): Promise<void> {
    this.loadingExercisesState.set(true)
    try {
      const exercises = await this.exercisesRepository.readActive()
      const withImages = await Promise.all(exercises.map(async exercise => {
        if (!exercise.image_path) return exercise
        const image = await this.exercisesRepository.readImage(exercise.id)
        return {...exercise, imageUrl: image ? URL.createObjectURL(image) : undefined}
      }))
      const previous = this.exercisesState()
      this.exercisesState.set(withImages)
      this.revokeExerciseImageUrls(previous)
    } finally {
      this.loadingExercisesState.set(false)
    }
  }

  ngOnDestroy(): void {
    this.revokeExerciseImageUrls(this.exercisesState())
    this.revokeExerciseImageUrls(this.exerciseDetailState() ? [this.exerciseDetailState()!] : [])
  }

  readExercise(id: number): Promise<TrainingExercise> {
    return this.exercisesRepository.readById(id)
  }

  async loadExerciseDetail(id: number): Promise<void> {
    this.loadingExerciseDetailState.set(true)
    this.exerciseDetailErrorState.set(null)
    const previous = this.exerciseDetailState()
    try {
      const exercise = await this.exercisesRepository.readById(id)
      const [history, image] = await Promise.all([
        this.trackingRepository.readByExercise(id),
        exercise.image_path ? this.exercisesRepository.readImage(id) : Promise.resolve(null),
      ])
      this.exerciseDetailState.set({...exercise, imageUrl: image ? URL.createObjectURL(image) : undefined})
      this.exerciseHistoryState.set(history)
      if (previous) this.revokeExerciseImageUrls([previous])
    } catch {
      this.exerciseDetailState.set(null)
      this.exerciseHistoryState.set([])
      this.exerciseDetailErrorState.set('No se ha podido cargar el ejercicio y su seguimiento.')
      if (previous) this.revokeExerciseImageUrls([previous])
    } finally {
      this.loadingExerciseDetailState.set(false)
    }
  }

  async saveExercise(draft: TrainingExerciseDraft): Promise<TrainingExercise> {
    const saved = await this.exercisesRepository.save(draft)
    await this.loadExercises()
    return saved
  }

  async uploadExerciseImage(exerciseId: number, file: File): Promise<string> {
    const path = await this.exercisesRepository.uploadImage(exerciseId, file)
    await this.loadExercises()
    return path
  }

  async removeExerciseImage(exerciseId: number): Promise<void> {
    await this.exercisesRepository.removeImage(exerciseId)
    await this.loadExercises()
  }

  async archiveExercise(exerciseId: number): Promise<void> {
    await this.exercisesRepository.archive(exerciseId)
    await Promise.all([this.loadExercises(), this.loadSchedule()])
  }

  async loadSchedule(): Promise<void> {
    this.loadingScheduleState.set(true)
    try {
      const [schedules, items] = await Promise.all([
        this.scheduleRepository.readCatalog(),
        this.scheduleRepository.readAll(),
      ])
      this.schedulesState.set(schedules)
      this.scheduleItemsState.set(items)
    } finally {
      this.loadingScheduleState.set(false)
    }
  }

  selectSchedule(scheduleId: number): void {
    if (this.schedulesState().some(schedule => schedule.id === scheduleId)) this.selectedScheduleIdState.set(scheduleId)
  }

  async createSchedule(name: string): Promise<void> {
    const created = await this.scheduleRepository.create(name)
    await this.loadSchedule()
    this.selectedScheduleIdState.set(created.id)
  }

  async renameSelectedSchedule(name: string): Promise<void> {
    const scheduleId = this.requireSelectedScheduleId()
    await this.scheduleRepository.rename(scheduleId, name)
    await this.loadSchedule()
  }

  async duplicateSelectedSchedule(name: string): Promise<void> {
    const schedule = this.selectedSchedule()
    if (!schedule) throw new Error('No selected training schedule')
    await this.scheduleRepository.duplicate(schedule, this.selectedScheduleItems(), name)
    await this.loadSchedule()
    const created = this.schedulesState().find(item => item.name.localeCompare(name, undefined, {sensitivity: 'base'}) === 0)
    if (created) this.selectedScheduleIdState.set(created.id)
  }

  async activateSelectedSchedule(): Promise<void> {
    await this.scheduleRepository.activate(this.requireSelectedScheduleId())
    await this.loadSchedule()
  }

  async deleteSelectedSchedule(): Promise<void> {
    const schedule = this.selectedSchedule()
    if (!schedule) throw new Error('No selected training schedule')
    if (schedule.is_active) throw new Error('The active training schedule cannot be deleted')
    if (this.schedulesState().length === 1) throw new Error('The last training schedule cannot be deleted')
    await this.scheduleRepository.delete(schedule.id)
    await this.loadSchedule()
  }

  async saveScheduleCatalog(
    drafts: readonly TrainingScheduleCatalogDraftItem[],
    selectedKey: string,
  ): Promise<void> {
    this.savingScheduleCatalogState.set(true)
    try {
      const result = await this.scheduleRepository.saveCatalog(drafts, selectedKey)
      await this.loadSchedule()
      this.selectedScheduleIdState.set(result.selectedScheduleId)
    } finally {
      this.savingScheduleCatalogState.set(false)
    }
  }

  async saveScheduleDay(weekday: number, drafts: readonly TrainingScheduleDraft[]): Promise<void> {
    this.savingScheduleState.set(true)
    try {
      await this.scheduleRepository.replaceDay(this.requireSelectedScheduleId(), weekday, drafts)
      await this.loadSchedule()
    } finally {
      this.savingScheduleState.set(false)
    }
  }

  async shareExercises(exerciseIds: readonly number[]): Promise<TrainingShareCreated> {
    return this.share(async () => this.shareRepository.create('exercises', exerciseIds))
  }

  async shareSelectedSchedule(): Promise<TrainingShareCreated> {
    return this.share(async () => this.shareRepository.create('schedule', [], this.requireSelectedScheduleId()))
  }

  async loadShares(): Promise<void> {
    this.sharesState.set(await this.shareRepository.list())
  }

  async revokeShare(shareId: string): Promise<void> {
    await this.shareRepository.revoke(shareId)
    await this.loadShares()
  }

  selectDate(date: Date): void {
    if (formatDateForDatabase(date) !== formatDateForDatabase(this.selectedDateState())) {
      this.recentSessionsState.set(new Map())
    }
    this.selectedDateState.set(date)
  }

  async loadEntries(date = this.selectedDateState()): Promise<void> {
    const dateKey = formatDateForDatabase(date)
    this.loadingEntriesState.set(true)
    try {
      const entries = await this.trackingRepository.readByDate(dateKey)
      if (dateKey !== formatDateForDatabase(this.selectedDateState())) return
      this.entriesState.set(entries)
      void this.loadPreviousSessions(entries.map(entry => entry.exercise_id), date)
    } finally {
      if (dateKey === formatDateForDatabase(this.selectedDateState())) this.loadingEntriesState.set(false)
    }
  }

  async loadPreviousSessions(
    exerciseIds: readonly number[],
    date = this.selectedDateState(),
  ): Promise<void> {
    const dateKey = formatDateForDatabase(date)
    const uniqueIds = [...new Set(exerciseIds)]
    await Promise.all(uniqueIds.map(exerciseId => this.loadRecentSessions(exerciseId, dateKey)))
  }

  async saveEntries(drafts: readonly TrainingEntryDraft[]): Promise<void> {
    this.savingEntriesState.set(true)
    try {
      await this.trackingRepository.replaceDate(formatDateForDatabase(this.selectedDateState()), drafts)
      await this.loadEntries()
    } finally {
      this.savingEntriesState.set(false)
    }
  }

  private async initializeSchedules(): Promise<void> {
    await this.scheduleRepository.ensureDefault()
    await this.loadSchedule()
  }

  private requireSelectedScheduleId(): number {
    const scheduleId = this.selectedScheduleIdState()
    if (!scheduleId) throw new Error('No selected training schedule')
    return scheduleId
  }

  private async share(create: () => Promise<TrainingShareCreated>): Promise<TrainingShareCreated> {
    this.sharingState.set(true)
    try {
      const result = await create()
      await this.loadShares()
      return result
    } finally {
      this.sharingState.set(false)
    }
  }

  private loadRecentSessions(exerciseId: number, dateKey: string): Promise<void> {
    if (dateKey === formatDateForDatabase(this.selectedDateState())
      && this.recentSessionsState().has(exerciseId)) return Promise.resolve()

    const requestKey = `${dateKey}:${exerciseId}`
    const pending = this.recentSessionRequests.get(requestKey)
    if (pending) return pending

    const request = this.trackingRepository.readRecentBeforeByExercise(exerciseId, dateKey)
      .then(recentSessions => {
        if (dateKey !== formatDateForDatabase(this.selectedDateState())) return
        this.recentSessionsState.update(sessions => {
          const updated = new Map(sessions)
          updated.set(exerciseId, recentSessions)
          return updated
        })
      })
      .catch(() => undefined)
      .finally(() => this.recentSessionRequests.delete(requestKey))
    this.recentSessionRequests.set(requestKey, request)
    return request
  }

  private revokeExerciseImageUrls(exercises: readonly TrainingExerciseListItem[]): void {
    for (const exercise of exercises) {
      if (exercise.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(exercise.imageUrl)
    }
  }
}
