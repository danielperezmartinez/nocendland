import {DOCUMENT} from '@angular/common'
import {computed, effect, inject, Injectable} from '@angular/core'
import {toSignal} from '@angular/core/rxjs-interop'
import {map} from 'rxjs'
import {NavigationService} from './navigation.service'

export type AreaTheme = 'home' | 'llimbro' | 'miscellaneous' | 'finances'

export function resolveAreaTheme(url: string): AreaTheme {
  const primarySegment = url.split(/[?#]/, 1)[0].split('/').find(Boolean)

  if (primarySegment === 'llimbro' || primarySegment === 'miscellaneous' || primarySegment === 'finances') {
    return primarySegment
  }
  return 'home'
}

@Injectable({providedIn: 'root'})
export class AreaThemeService {
  private readonly document = inject(DOCUMENT)
  private readonly navigation = inject(NavigationService)
  private readonly navigationUrl = toSignal(
    this.navigation.navigationEnd().pipe(map(event => event.urlAfterRedirects)),
    {initialValue: this.navigation.currentUrl()},
  )

  readonly area = computed(() => resolveAreaTheme(this.navigationUrl()))

  constructor() {
    effect(() => {
      this.document.body.dataset['area'] = this.area()
    })
  }
}
