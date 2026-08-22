import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectiveConfigComponent } from './objective-config.component';
import {NutritionStore} from '@areas/llimbro/nutrition/state/nutrition.store';
import {createNutritionStoreStub} from '@testing/nutrition-store.stub';
import {DialogRef} from '@shared/ui/dialog'

describe('ObjectiveConfigComponent', () => {
  let component: ObjectiveConfigComponent;
  let fixture: ComponentFixture<ObjectiveConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectiveConfigComponent],
      providers: [
        {provide: NutritionStore, useFactory: createNutritionStoreStub},
        {provide: DialogRef, useValue: {close: () => undefined}},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObjectiveConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
