import {Component} from '@angular/core'
import {ComponentFixture, TestBed} from '@angular/core/testing'
import {provideRouter, Router} from '@angular/router'
import {FeatureSwipeNavigationDirective} from './feature-swipe-navigation.directive'

@Component({
  imports: [FeatureSwipeNavigationDirective],
  template: `
    <section
      [appFeatureSwipeNavigation]="items"
      [featureSwipeActiveId]="activeId"
    ></section>
  `,
})
class SwipeHostComponent {
  readonly items = [
    {id: 'first', label: 'Primera', icon: 'analytics', commands: ['/first']},
    {id: 'second', label: 'Segunda', icon: 'calendar_month', commands: ['/second']},
  ] as const
  readonly activeId = 'first'
}

describe('FeatureSwipeNavigationDirective', () => {
  let fixture: ComponentFixture<SwipeHostComponent>
  let router: Router

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwipeHostComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(SwipeHostComponent)
    router = TestBed.inject(Router)
    fixture.detectChanges()
  })

  it('should navigate to the next tab after a horizontal swipe', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true)
    const host = fixture.nativeElement.querySelector('section') as HTMLElement
    const start = new Touch({identifier: 1, target: host, clientX: 260, clientY: 120})
    const end = new Touch({identifier: 1, target: host, clientX: 120, clientY: 126})
    const touchStart = new TouchEvent('touchstart')
    const touchEnd = new TouchEvent('touchend')
    Object.defineProperty(touchStart, 'touches', {value: touchList(start)})
    Object.defineProperty(touchEnd, 'changedTouches', {value: touchList(end)})

    host.dispatchEvent(touchStart)
    host.dispatchEvent(touchEnd)

    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/second'])
  })
})

function touchList(touch: Touch): TouchList {
  return {
    0: touch,
    length: 1,
    item: index => index === 0 ? touch : null,
    [Symbol.iterator]: () => [touch].values(),
  }
}
