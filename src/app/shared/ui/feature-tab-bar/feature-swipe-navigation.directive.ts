import {Directive, ElementRef, inject, input} from '@angular/core'
import {Router} from '@angular/router'
import {FeatureTabItem} from './feature-tab-bar.models'

@Directive({
  selector: '[appFeatureSwipeNavigation]',
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
})
export class FeatureSwipeNavigationDirective<TId extends string = string> {
  readonly items = input.required<readonly FeatureTabItem<TId>[]>({alias: 'appFeatureSwipeNavigation'})
  readonly activeId = input.required<TId | null>({alias: 'featureSwipeActiveId'})
  readonly enabled = input(true, {alias: 'featureSwipeEnabled'})

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly router = inject(Router)
  private startX: number | null = null
  private startY: number | null = null

  protected onTouchStart(event: TouchEvent): void {
    if (!this.enabled() || event.touches.length !== 1 || this.isInteractiveTarget(event.target)) {
      this.resetGesture()
      return
    }

    const touch = event.touches.item(0)
    this.startX = touch?.clientX ?? null
    this.startY = touch?.clientY ?? null
  }

  protected onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches.item(0)
    if (this.startX === null || this.startY === null || !touch) return

    const deltaX = touch.clientX - this.startX
    const deltaY = touch.clientY - this.startY
    this.resetGesture()

    if (Math.abs(deltaX) < 80 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return
    this.navigateToAdjacentTab(deltaX < 0 ? 1 : -1)
  }

  private navigateToAdjacentTab(offset: -1 | 1): void {
    const items = this.items()
    const currentIndex = items.findIndex(item => item.id === this.activeId())
    if (items.length < 2 || currentIndex < 0) return

    const targetIndex = (currentIndex + offset + items.length) % items.length
    const target = items[targetIndex]
    if (target) void this.router.navigate([...target.commands])
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element) || !this.host.nativeElement.contains(target)) return true
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [data-feature-swipe-lock]'))
  }

  private resetGesture(): void {
    this.startX = null
    this.startY = null
  }
}
