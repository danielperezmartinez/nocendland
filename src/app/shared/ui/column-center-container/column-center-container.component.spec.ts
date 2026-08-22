import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnCenterContainerComponent } from './column-center-container.component';

describe('ColumnCenterContainerComponent', () => {
  let component: ColumnCenterContainerComponent;
  let fixture: ComponentFixture<ColumnCenterContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnCenterContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColumnCenterContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
