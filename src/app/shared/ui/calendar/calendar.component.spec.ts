import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarComponent } from './calendar.component';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('presents the controlled date without replacing it on initialization', () => {
    const emitted = vi.fn()
    component.dateSelected.subscribe(emitted)
    fixture.componentRef.setInput('date', new Date(2026, 7, 3))
    fixture.detectChanges()

    const selected: HTMLButtonElement = fixture.nativeElement.querySelector('.calendar__day--selected')
    expect(selected.textContent?.trim()).toBe('3')
    expect(emitted).not.toHaveBeenCalled()
  })
});
