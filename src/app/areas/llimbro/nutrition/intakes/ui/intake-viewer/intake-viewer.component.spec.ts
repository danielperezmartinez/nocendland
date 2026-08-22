import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntakeViewerComponent } from './intake-viewer.component';
import {NutritionStore} from '@areas/llimbro/nutrition/state/nutrition.store';
import {createNutritionStoreStub} from '@testing/nutrition-store.stub';
import {DIALOG_DATA, DialogRef} from '@shared/ui/dialog'

describe('IntakeViewerComponent', () => {
  let component: IntakeViewerComponent;
  let fixture: ComponentFixture<IntakeViewerComponent>;
  let nutritionStore: ReturnType<typeof createNutritionStoreStub>;

  beforeEach(async () => {
    nutritionStore = createNutritionStoreStub()
    nutritionStore.saveIntake = vi.fn(async () => undefined)

    await TestBed.configureTestingModule({
      imports: [IntakeViewerComponent],
      providers: [
        {provide: NutritionStore, useValue: nutritionStore},
        {provide: DIALOG_DATA, useValue: {currentIndex: 0}},
        {provide: DialogRef, useValue: {close: () => undefined}},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntakeViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not save an intake quantity outside the accepted range', async () => {
    vi.useFakeTimers()
    const quantityInput = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement

    quantityInput.value = '100001'
    quantityInput.dispatchEvent(new Event('input', {bubbles: true}))
    await vi.advanceTimersByTimeAsync(1000)

    expect(nutritionStore.saveIntake).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
});
