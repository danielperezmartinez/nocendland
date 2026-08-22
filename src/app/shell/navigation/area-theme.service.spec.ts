import {DOCUMENT} from '@angular/common'
import {TestBed} from '@angular/core/testing'
import {NavigationEnd} from '@angular/router'
import {Subject} from 'rxjs'
import {AreaThemeService, resolveAreaTheme} from './area-theme.service'
import {NavigationService} from './navigation.service'

describe('AreaThemeService', () => {
  const navigationEvents = new Subject<NavigationEnd>()
  const navigation = {
    currentUrl: () => '/llimbro/nutrition/intakes',
    navigationEnd: () => navigationEvents.asObservable(),
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AreaThemeService,
        {provide: NavigationService, useValue: navigation},
      ],
    })
  })

  afterEach(() => {
    TestBed.inject(DOCUMENT).body.removeAttribute('data-area')
  })

  it('resolves the supported area from the primary URL segment', () => {
    expect(resolveAreaTheme('/llimbro/training/tracking?date=2026-08-22')).toBe('llimbro')
    expect(resolveAreaTheme('/miscellaneous')).toBe('miscellaneous')
    expect(resolveAreaTheme('/finances/overview#balance')).toBe('finances')
    expect(resolveAreaTheme('/auth')).toBe('home')
  })

  it('keeps the body area in sync with navigation', () => {
    TestBed.inject(AreaThemeService)
    TestBed.tick()

    const body = TestBed.inject(DOCUMENT).body
    expect(body.dataset['area']).toBe('llimbro')

    navigationEvents.next(new NavigationEnd(1, '/llimbro/nutrition', '/finances/overview'))
    TestBed.tick()

    expect(body.dataset['area']).toBe('finances')
  })
})
