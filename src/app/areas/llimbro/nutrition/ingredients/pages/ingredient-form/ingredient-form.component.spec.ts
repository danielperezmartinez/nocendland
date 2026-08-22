import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientFormComponent } from './ingredient-form.component';
import {ActivatedRoute} from '@angular/router';
import {NutritionStore} from '@areas/llimbro/nutrition/state/nutrition.store';
import {createNutritionStoreStub} from '@testing/nutrition-store.stub';

describe('IngredientFormComponent', () => {
  let component: IngredientFormComponent;
  let fixture: ComponentFixture<IngredientFormComponent>;
  let nutritionStore: ReturnType<typeof createNutritionStoreStub>;

  beforeEach(async () => {
    nutritionStore = createNutritionStoreStub()
    nutritionStore.saveIngredient = vi.fn(async ingredient => ingredient)

    await TestBed.configureTestingModule({
      imports: [IngredientFormComponent],
      providers: [
        {provide: ActivatedRoute, useValue: {snapshot: {params: {id: 'new'}}}},
        {provide: NutritionStore, useValue: nutritionStore}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngredientFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not save nutritional values outside the accepted range', () => {
    const caloriesInput = fixture.nativeElement.querySelector('[formControlName="calories_per_100"]') as HTMLInputElement

    caloriesInput.value = '1001'
    caloriesInput.dispatchEvent(new Event('input', {bubbles: true}))
    caloriesInput.dispatchEvent(new Event('change', {bubbles: true}))

    expect(nutritionStore.saveIngredient).not.toHaveBeenCalled()
  })
});
