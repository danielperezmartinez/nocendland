import {DOCUMENT} from '@angular/common'
import {computed, effect, inject, Injectable, signal} from '@angular/core'

export type ColorTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'nocendland-color-theme'

@Injectable({providedIn: 'root'})
export class ThemeService {
  private readonly document = inject(DOCUMENT)
  private readonly themeState = signal<ColorTheme>(this.readInitialTheme())

  readonly theme = this.themeState.asReadonly()
  readonly isDark = computed(() => this.themeState() === 'dark')

  constructor() {
    effect(() => {
      const theme = this.themeState()
      const root = this.document.documentElement

      root.dataset['theme'] = theme
      localStorage.setItem(THEME_STORAGE_KEY, theme)

      const browserTheme = getComputedStyle(root).getPropertyValue('--color-browser-theme').trim()
      this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', browserTheme)
    })
  }

  toggle(): void {
    this.themeState.update(theme => theme === 'dark' ? 'light' : 'dark')
  }

  private readInitialTheme(): ColorTheme {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme

    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}
