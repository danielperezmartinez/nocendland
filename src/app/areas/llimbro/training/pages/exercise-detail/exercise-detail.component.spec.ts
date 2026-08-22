import {ComponentFixture, TestBed} from '@angular/core/testing'
import {ActivatedRoute, convertToParamMap} from '@angular/router'
import {NavigationService} from '@shell/navigation/navigation.service'
import {CssTokenService, ThemeService} from '@shared/ui/theme'
import {createTrainingStoreStub} from '@testing/training-store.stub'
import {TrainingStore} from '../../state/training.store'
import {ExerciseDetailComponent} from './exercise-detail.component'

describe('ExerciseDetailComponent', () => {
  let fixture: ComponentFixture<ExerciseDetailComponent>
  const navigation = {to: vi.fn().mockResolvedValue(true)}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseDetailComponent],
      providers: [
        {provide: TrainingStore, useValue: createTrainingStoreStub()},
        {provide: ActivatedRoute, useValue: {
          snapshot: {params: {id: '1'}, queryParamMap: convertToParamMap({from: 'tracking', date: '2026-08-03'})},
        }},
        {provide: NavigationService, useValue: navigation},
        {provide: CssTokenService, useValue: {get: () => '#4caf75'}},
        {provide: ThemeService, useValue: {theme: () => 'dark', isDark: () => true}},
      ],
    }).compileComponents()
    fixture = TestBed.createComponent(ExerciseDetailComponent)
    fixture.detectChanges()
  })

  it('renders the saved exercise and its strength progress', () => {
    expect(fixture.nativeElement.textContent).toContain('Sentadilla')
    expect(fixture.nativeElement.textContent).toContain('1RM estimado')
    expect(fixture.nativeElement.textContent).toContain('40 kg × 10')
  })

  it('uses the shared badge component for the exercise taxonomy', () => {
    const badges = [...fixture.nativeElement.querySelectorAll('.exercise-detail-tags app-badge')] as HTMLElement[]
    expect(badges.map(badge => badge.textContent?.trim())).toEqual(['Fuerza', 'Cuádriceps', 'Sentadilla'])
  })

  it('opens editing while preserving the return context', () => {
    const button: HTMLButtonElement = [...fixture.nativeElement.querySelectorAll('.exercise-detail-mode button')][1]
    button.click()
    expect(navigation.to).toHaveBeenCalledWith('training', 'exercise-form', '1', {
      queryParams: {from: 'tracking', date: '2026-08-03'},
    })
  })
})
