import {ComponentFixture, TestBed} from '@angular/core/testing'
import {ConfirmDialogService} from '@shared/ui/confirm-dialog'
import {createTrainingStoreStub} from '@testing/training-store.stub'
import {of} from 'rxjs'
import {TrainingStore} from '../../state/training.store'
import {ScheduleComponent} from './schedule.component'

describe('ScheduleComponent', () => {
  let fixture: ComponentFixture<ScheduleComponent>
  let store: ReturnType<typeof createTrainingStoreStub>
  const confirmDialog = {open: vi.fn().mockReturnValue(of(false))}

  beforeEach(async () => {
    store = createTrainingStoreStub()
    confirmDialog.open.mockReset()
    confirmDialog.open.mockReturnValue(of(false))
    await TestBed.configureTestingModule({
      imports: [ScheduleComponent],
      providers: [
        {provide: TrainingStore, useValue: store},
        {provide: ConfirmDialogService, useValue: confirmDialog},
      ],
    }).compileComponents()
    fixture = TestBed.createComponent(ScheduleComponent)
    fixture.detectChanges()
  })

  it('renders the seven weekdays in order', () => {
    const days = [...fixture.nativeElement.querySelectorAll('.weekday-strip button')]
      .map((button: Element) => button.textContent?.trim())
    expect(days).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'])
  })

  it('loads persisted targets without replacing empty or existing repetitions', () => {
    selectMonday()
    const card: HTMLElement = fixture.nativeElement.querySelector('.schedule-card')
    const values = [...card.querySelectorAll('input')].map(input => input.value)
    expect(values).toEqual(['3', '', '40'])
    expect(card.querySelector('.ui-segmented-input__option--active')?.textContent?.trim()).toBe('10')
  })

  it('shows only the selector, status and edit action in the collapsed catalog', () => {
    const catalog: HTMLElement = fixture.nativeElement.querySelector('.schedule-catalog')
    expect(catalog.textContent).toContain('Activo en Seguimiento')
    expect(catalog.querySelector('.schedule-catalog__status .badge')?.getAttribute('data-status')).toBe('primary')
    expect(catalog.textContent).not.toContain('Nuevo')
    expect(catalog.querySelector('[aria-label="Editar catálogo"]')).not.toBeNull()
  })

  it('uses the neutral badge state for inactive schedules', () => {
    store.selectedSchedule.set({...store.selectedSchedule()!, is_active: false})
    fixture.detectChanges()

    const badge: HTMLElement = fixture.nativeElement.querySelector('.schedule-catalog__status .badge')
    expect(badge.textContent?.trim()).toBe('No activo')
    expect(badge.getAttribute('data-status')).toBe('neutral')
  })

  it('uses count badges for exercise positions', () => {
    selectMonday()
    const badge: HTMLElement = fixture.nativeElement.querySelector('.schedule-card__index .badge--count')
    expect(badge.textContent?.trim()).toBe('1')
    expect(badge.getAttribute('aria-label')).toBe('Ejercicio 1')
  })

  it('opens catalog editing exclusively and restores the persisted catalog when cancelled', async () => {
    click('[aria-label="Editar catálogo"]')
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.weekday-strip')).toBeNull()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.schedule-catalog input.ui-input')
    input.value = 'Horario modificado'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    clickButton('Cancelar')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.weekday-strip')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('.schedule-catalog select').selectedOptions[0].textContent).toBe('Horario 1')
  })

  it('places the add action in the selected-day heading and gives new exercises 12 repetitions', () => {
    const tuesday: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.weekday-strip button')[1]
    tuesday.click()
    fixture.detectChanges()
    const heading: HTMLElement = fixture.nativeElement.querySelector('.schedule-board > header')
    const addButton = [...heading.querySelectorAll('button')]
      .find(button => button.textContent?.includes('Añadir ejercicios')) as HTMLButtonElement
    expect(addButton).toBeDefined()

    addButton.click()
    fixture.detectChanges()
    click('.data-list__item')
    fixture.detectChanges()
    clickButton('Confirmar selección')
    fixture.detectChanges()

    const customRepetitions: HTMLInputElement = fixture.nativeElement.querySelector('.ui-segmented-input__custom')
    expect(customRepetitions.value).toBe('')
    const activePreset: HTMLButtonElement = fixture.nativeElement.querySelector('.ui-segmented-input__option--active')
    expect(activePreset.textContent?.trim()).toBe('12')
  })

  it('sends the complete catalog draft only when changes are saved', async () => {
    const saveCatalog = vi.spyOn(store, 'saveScheduleCatalog')
    click('[aria-label="Editar catálogo"]')
    await fixture.whenStable()
    fixture.detectChanges()
    clickButton('Nuevo')
    fixture.detectChanges()
    clickButton('Guardar cambios')
    await fixture.whenStable()
    fixture.detectChanges()

    expect(saveCatalog).toHaveBeenCalled()
    const [drafts, selectedKey] = saveCatalog.mock.lastCall!
    expect(drafts.length).toBe(2)
    expect(selectedKey).toContain('new:')
  })

  it('supports custom repetitions after using a quick preset', () => {
    selectMonday()
    const preset: HTMLButtonElement = [...fixture.nativeElement.querySelectorAll('.ui-segmented-input button')]
      .find((button: HTMLButtonElement) => button.textContent?.trim() === '8')
    preset.click()
    fixture.detectChanges()
    expect(preset.getAttribute('aria-pressed')).toBe('true')

    const custom: HTMLInputElement = fixture.nativeElement.querySelector('.ui-segmented-input__custom')
    custom.value = '15'
    custom.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.ui-segmented-input__option--active')).toBeNull()
    expect(custom.value).toBe('15')
  })

  it('reorders cards from the keyboard and updates their visual positions', () => {
    const exercises = store.exercises()
    store.exercises.set([...exercises, {...exercises[0], id: 2, name: 'Press banca'}])
    const items = store.selectedScheduleItems()
    store.selectedScheduleItems.set([...items, {
      ...items[0],
      id: 11,
      exercise_id: 2,
      sort_order: 1,
      training_exercise: {id: 2, name: 'Press banca'},
    }])
    selectMonday()

    const firstHandle: HTMLButtonElement = fixture.nativeElement.querySelector('[uiSortableHandle]')
    firstHandle.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
    fixture.detectChanges()
    const names = [...fixture.nativeElement.querySelectorAll('.schedule-card h3')]
      .map((heading: HTMLElement) => heading.textContent?.trim())
    expect(names).toEqual(['Press banca', 'Sentadilla'])
    expect(fixture.nativeElement.textContent).toContain('Cambios sin guardar')
  })

  it('asks before discarding day changes when changing weekday', async () => {
    selectMonday()
    const preset: HTMLButtonElement = fixture.nativeElement.querySelector('.ui-segmented-input button')
    preset.click()
    fixture.detectChanges()
    const tuesday: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.weekday-strip button')[1]
    tuesday.click()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(confirmDialog.open).toHaveBeenCalled()
    expect(tuesday.getAttribute('aria-current')).toBeNull()
  })

  it('restores the persisted day after accepting discard to edit the catalog', async () => {
    confirmDialog.open.mockReturnValue(of(true))
    selectMonday()
    const custom: HTMLInputElement = fixture.nativeElement.querySelector('.ui-segmented-input__custom')
    custom.value = '15'
    custom.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    click('[aria-label="Editar catálogo"]')
    await fixture.whenStable()
    fixture.detectChanges()
    clickButton('Cancelar')
    fixture.detectChanges()

    const activePreset: HTMLButtonElement = fixture.nativeElement.querySelector('.ui-segmented-input__option--active')
    expect(activePreset.textContent?.trim()).toBe('10')
    expect(fixture.nativeElement.textContent).toContain('Horario al día')
  })

  function selectMonday(): void {
    const monday: HTMLButtonElement = fixture.nativeElement.querySelector('.weekday-strip button')
    monday.click()
    fixture.detectChanges()
  }

  function click(selector: string): void {
    const element: HTMLButtonElement = fixture.nativeElement.querySelector(selector)
    element.click()
  }

  function clickButton(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('button')]
      .find((candidate: HTMLButtonElement) => candidate.textContent?.includes(label)) as HTMLButtonElement
    button.click()
  }
})
