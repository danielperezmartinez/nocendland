import {ComponentFixture, TestBed} from '@angular/core/testing'
import {provideRouter} from '@angular/router'
import {FeatureTabBarComponent} from './feature-tab-bar.component'

describe('FeatureTabBarComponent', () => {
  let fixture: ComponentFixture<FeatureTabBarComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureTabBarComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(FeatureTabBarComponent)
    fixture.componentRef.setInput('items', [
      {id: 'first', label: 'Primera', icon: 'analytics', commands: ['/first']},
      {id: 'second', label: 'Segunda', icon: 'calendar_month', commands: ['/second']},
    ])
    fixture.componentRef.setInput('activeId', 'second')
    fixture.detectChanges()
  })

  it('should expose the active destination as the current page', () => {
    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>

    expect(links.length).toBe(2)
    expect(links[1].getAttribute('aria-current')).toBe('page')
  })
})
