import {ComponentFixture, TestBed} from '@angular/core/testing'
import {ComingSoonComponent} from './coming-soon.component'

describe('Finances coming soon page', () => {
  let fixture: ComponentFixture<ComingSoonComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [ComingSoonComponent]}).compileComponents()
    fixture = TestBed.createComponent(ComingSoonComponent)
    fixture.detectChanges()
  })

  it('identifies the area and its development status', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Finanzas')
    expect(fixture.nativeElement.querySelector('app-badge').textContent.trim()).toBe('En desarrollo')
  })
})
