import {ComponentFixture, TestBed} from '@angular/core/testing'
import {MeasurementsComponent} from './measurements.component'

describe('MeasurementsComponent', () => {
  let fixture: ComponentFixture<MeasurementsComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [MeasurementsComponent]}).compileComponents()
    fixture = TestBed.createComponent(MeasurementsComponent)
    fixture.detectChanges()
  })

  it('uses the shared badge for its development status', () => {
    const badge: HTMLElement = fixture.nativeElement.querySelector('app-badge .badge--label')
    expect(badge.textContent?.trim()).toBe('En desarrollo')
  })
})
