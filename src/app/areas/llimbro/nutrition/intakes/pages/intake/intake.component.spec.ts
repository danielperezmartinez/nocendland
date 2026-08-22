import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntakeComponent } from './intake.component';
import {NutritionStore} from '@areas/llimbro/nutrition/state/nutrition.store';
import {createNutritionStoreStub} from '@testing/nutrition-store.stub';

describe('IntakeComponent', () => {
  let component: IntakeComponent;
  let fixture: ComponentFixture<IntakeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntakeComponent],
      providers: [{provide: NutritionStore, useFactory: createNutritionStoreStub}]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntakeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
