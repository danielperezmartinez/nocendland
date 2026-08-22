import {signal} from '@angular/core'
import {ComponentFixture, TestBed} from '@angular/core/testing'
import {ActivatedRoute, convertToParamMap} from '@angular/router'
import {NavigationService} from '@shell/navigation/navigation.service'
import {ConfirmDialogService} from '@shared/ui/confirm-dialog'
import {TrainingStore} from '../../state/training.store'
import {ExerciseFormComponent} from './exercise-form.component'

describe('ExerciseFormComponent', () => {
  let fixture: ComponentFixture<ExerciseFormComponent>
  let store: {
    exercises: ReturnType<typeof signal<never[]>>
    savingExercise: ReturnType<typeof signal<boolean>>
    savingExerciseImage: ReturnType<typeof signal<boolean>>
    saveExercise: ReturnType<typeof vi.fn>
    uploadExerciseImage: ReturnType<typeof vi.fn>
    removeExerciseImage: ReturnType<typeof vi.fn>
    loadExercises: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    store = {
      exercises: signal([]),
      savingExercise: signal(false),
      savingExerciseImage: signal(false),
      saveExercise: vi.fn().mockResolvedValue({id: 8}),
      uploadExerciseImage: vi.fn().mockResolvedValue('training_exercise/user/8'),
      removeExerciseImage: vi.fn().mockResolvedValue(undefined),
      loadExercises: vi.fn().mockResolvedValue(undefined),
    }
    await TestBed.configureTestingModule({
      imports: [ExerciseFormComponent],
      providers: [
        {provide: ActivatedRoute, useValue: {snapshot: {params: {id: 'new'}, queryParamMap: convertToParamMap({})}}},
        {provide: TrainingStore, useValue: store},
        {provide: NavigationService, useValue: {to: vi.fn().mockResolvedValue(undefined)}},
        {provide: ConfirmDialogService, useValue: {open: vi.fn()}},
      ],
    }).compileComponents()
    fixture = TestBed.createComponent(ExerciseFormComponent)
    fixture.detectChanges()
  })

  it('opens the file selector when the image preview is clicked', () => {
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement
    vi.spyOn(input, 'click')
    ;(fixture.nativeElement.querySelector('.exercise-form__image-button') as HTMLButtonElement).click()
    expect(input.click).toHaveBeenCalled()
  })

  it('validates HTTPS video URLs', () => {
    const video = fixture.nativeElement.querySelector('input[type="url"]') as HTMLInputElement
    video.value = 'http://example.com/video'
    video.dispatchEvent(new Event('input'))
    video.dispatchEvent(new Event('blur'))
    fixture.detectChanges()
    expect(video.getAttribute('ng-reflect-is-disabled')).toBeNull()
    expect(fixture.nativeElement.textContent).toContain('empiece por https://')
  })

  it('persists video and the three taxonomy axes', async () => {
    const name = fixture.nativeElement.querySelector('input[formcontrolname="name"]') as HTMLInputElement
    const video = fixture.nativeElement.querySelector('input[formcontrolname="videoUrl"]') as HTMLInputElement
    name.value = 'Peso muerto'
    name.dispatchEvent(new Event('input'))
    video.value = 'https://example.com/deadlift'
    video.dispatchEvent(new Event('input'))
    const checkboxes = [...fixture.nativeElement.querySelectorAll('.exercise-form__chips input')] as HTMLInputElement[]
    for (const checkbox of [checkboxes[0], checkboxes[7], checkboxes[18]]) {
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change'))
    }
    fixture.detectChanges()
    ;(fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'))
    await fixture.whenStable()

    const draft = store.saveExercise.mock.lastCall?.[0]
    expect(draft.video_url).toBe('https://example.com/deadlift')
    expect(draft.training_modalities).toEqual(['strength'])
    expect(draft.muscle_groups).toEqual(['chest'])
    expect(draft.movement_patterns).toEqual(['push'])
  })
})
