import {ComponentFixture, TestBed} from '@angular/core/testing'
import {ActivatedRoute, convertToParamMap} from '@angular/router'
import {NavigationService} from '@shell/navigation/navigation.service'
import {createTrainingStoreStub} from '@testing/training-store.stub'
import {TrainingStore} from '../../state/training.store'
import {TrackingComponent} from './tracking.component'

describe('TrackingComponent', () => {
  let fixture: ComponentFixture<TrackingComponent>
  let store: ReturnType<typeof createTrainingStoreStub>
  const navigation = {to: vi.fn().mockResolvedValue(true)}

  beforeEach(async () => {
    store = createTrainingStoreStub()
    await TestBed.configureTestingModule({
      imports: [TrackingComponent],
      providers: [
        {provide: TrainingStore, useValue: store},
        {provide: ActivatedRoute, useValue: {snapshot: {queryParamMap: convertToParamMap({})}}},
        {provide: NavigationService, useValue: navigation},
      ],
    }).compileComponents()
    fixture = TestBed.createComponent(TrackingComponent)
    fixture.detectChanges()
  })

  it('renders repetitions and weight as numeric inputs in the same set row', () => {
    const repetitionsInput: HTMLInputElement = fixture.nativeElement.querySelector('.set-row__repetitions input')
    const weightInput: HTMLInputElement = fixture.nativeElement.querySelector('.set-row__weight input')

    expect(repetitionsInput.type).toBe('number')
    expect(repetitionsInput.value).toBe('10')
    expect(weightInput.value).toBe('40')
    expect(fixture.nativeElement.querySelector('.set-row__repetitions span')?.textContent?.trim()).toBe('Repeticiones')
    expect(fixture.nativeElement.querySelector('.set-row__weight span')?.textContent?.trim()).toBe('Peso · kg')
  })

  it('allows editing the repetitions prefilled from the schedule', () => {
    const repetitionsInput: HTMLInputElement = fixture.nativeElement.querySelector('.set-row__repetitions input')
    repetitionsInput.value = '12'
    repetitionsInput.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    const component = fixture.componentInstance as unknown as {
      drafts(): Array<{sets: Array<{repetitions: number | null}>}>
      dirty(): boolean
    }
    expect(component.drafts()[0].sets[0].repetitions).toBe(12)
    expect(component.dirty()).toBe(true)
  })

  it('uses count badges for set positions', () => {
    const badge: HTMLElement = fixture.nativeElement.querySelector('.set-row__position .badge--count')
    expect(badge.textContent?.trim()).toBe('1')
    expect(badge.getAttribute('aria-label')).toBe('Serie 1')
  })

  it('adds as many set rows as the user needs', () => {
    const addButton: HTMLButtonElement = fixture.nativeElement.querySelector('.tracking-entry__add-set')
    addButton.click()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.set-row').length).toBe(2)
  })

  it('opens the exercise detail preserving the tracking date', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.tracking-entry__detail')
    button.click()
    expect(navigation.to).toHaveBeenCalledWith('training', 'exercises', '1', {
      queryParams: {from: 'tracking', date: '2026-08-03'},
    })
  })

  it('shows the previous session date and its literal sets', () => {
    const reminder: HTMLElement = fixture.nativeElement.querySelector('.tracking-entry__previous')
    expect(reminder.textContent).toContain('Última sesión · 27 de julio de 2026')
    expect(reminder.textContent).toContain('S1')
    expect(reminder.textContent).toContain('10 reps × 40 kg')
    expect(reminder.textContent).toContain('— reps × sin peso')
  })

  it('does not show a reminder when there is no previous session', () => {
    store.previousSessions.set(new Map([[1, null]]))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.tracking-entry__previous')).toBeNull()
  })

  it('requests the previous session when adding an exercise during editing', () => {
    const loadPreviousSessions = vi.spyOn(store, 'loadPreviousSessions').mockResolvedValue(undefined)
    const exercise = {...store.exercises()[0], id: 2, name: 'Press banca'}
    store.schedule.set([{...store.schedule()[0], id: 11, exercise_id: 2}])
    const component = fixture.componentInstance as unknown as {
      addEntries(exercises: readonly typeof exercise[]): void
      drafts(): Array<{exerciseId: number; sets: Array<{repetitions: number | null}>}>
    }
    component.addEntries([exercise])

    expect(loadPreviousSessions).toHaveBeenCalledExactlyOnceWith([2])
    expect(component.drafts().find(entry => entry.exerciseId === 2)?.sets.map(set => set.repetitions))
      .toEqual([10, 10, 10])
  })

  it('shows an explained load-progression indicator after two completed sessions', () => {
    const baseSession = store.exerciseHistory()[0]
    const completedSets = [1, 2, 3].map(position => ({
      ...baseSession.training_set[0],
      id: 40 + position,
      position,
      repetitions: 10,
      weight_kg: 40,
    }))
    store.recentSessions.set(new Map([[1, [
      {...baseSession, id: 22, performed_on: '2026-07-27', training_set: completedSets},
      {...baseSession, id: 21, performed_on: '2026-07-20', training_set: completedSets},
    ]]]))
    fixture.detectChanges()

    const indicator: HTMLButtonElement = fixture.nativeElement.querySelector('.tracking-entry__recommendation')
    expect(indicator?.getAttribute('aria-label')).toBe('Recomendación: puedes subir peso')

    indicator.click()
    const tooltip: HTMLElement | null = document.querySelector('.ui-tooltip')
    expect(tooltip?.textContent).toContain('3 series de 10 repeticiones o más, desde 40 kg')
  })

  it('hides the progression indicator when the exercise has no complete schedule target', () => {
    store.schedule.set([])
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.tracking-entry__recommendation')).toBeNull()
  })
})
