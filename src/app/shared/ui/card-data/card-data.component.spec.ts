import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardDataComponent } from './card-data.component';

describe('CardDataComponent', () => {
  let component: CardDataComponent;
  let fixture: ComponentFixture<CardDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardDataComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', {label: 'Test', value: 1});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
