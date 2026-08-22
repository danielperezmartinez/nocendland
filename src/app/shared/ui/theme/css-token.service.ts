import {DOCUMENT} from '@angular/common'
import {inject, Injectable} from '@angular/core'

@Injectable({providedIn: 'root'})
export class CssTokenService {
  private readonly document = inject(DOCUMENT)

  get(token: `--${string}`): string {
    return getComputedStyle(this.document.documentElement).getPropertyValue(token).trim()
  }
}
