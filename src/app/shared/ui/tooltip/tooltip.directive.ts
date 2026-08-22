import {Overlay, OverlayRef} from '@angular/cdk/overlay'
import {ComponentPortal} from '@angular/cdk/portal'
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  inject,
  Injector,
  input,
  InjectionToken,
} from '@angular/core'

const TOOLTIP_TEXT = new InjectionToken<string>('TOOLTIP_TEXT')
const TOOLTIP_ID = new InjectionToken<string>('TOOLTIP_ID')
const HOVER_DELAY_MS = 250
let nextTooltipId = 0

@Component({
  selector: 'app-tooltip-surface',
  template: '<span class="ui-tooltip" [id]="id" role="tooltip">{{ text }}</span>',
  changeDetection: ChangeDetectionStrategy.Eager,
})
class TooltipSurfaceComponent {
  protected readonly text = inject(TOOLTIP_TEXT)
  protected readonly id = inject(TOOLTIP_ID)
}

@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective {
  readonly text = input.required<string>({alias: 'appTooltip'})
  readonly disabled = input(false, {alias: 'appTooltipDisabled'})

  private readonly overlay = inject(Overlay)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly environmentInjector = inject(EnvironmentInjector)
  private readonly destroyRef = inject(DestroyRef)
  private readonly tooltipId = `atlas-tooltip-${++nextTooltipId}`
  private overlayRef: OverlayRef | null = null
  private hoverTimer: ReturnType<typeof setTimeout> | null = null
  private pinned = false
  private descriptionAttached = false
  private previousDescribedBy: string | null = null

  constructor() {
    this.destroyRef.onDestroy(() => this.close())
  }

  @HostListener('pointerenter', ['$event'])
  protected handlePointerEnter(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || this.disabled()) return
    this.cancelHoverTimer()
    this.hoverTimer = setTimeout(() => this.open(), HOVER_DELAY_MS)
  }

  @HostListener('pointerleave')
  protected handlePointerLeave(): void {
    this.cancelHoverTimer()
    if (!this.pinned) this.close()
  }

  @HostListener('focusin')
  protected handleFocus(): void {
    if (!this.disabled()) this.open()
  }

  @HostListener('focusout')
  protected handleBlur(): void {
    this.close()
  }

  @HostListener('click')
  protected handleClick(): void {
    if (this.disabled()) return
    this.cancelHoverTimer()
    if (this.pinned) {
      this.close()
      return
    }
    this.open()
    this.pinned = true
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    this.close()
  }

  private open(): void {
    if (this.overlayRef?.hasAttached() || this.disabled() || !this.text().trim()) return

    const positionStrategy = this.overlay.position().flexibleConnectedTo(this.element).withPositions([
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -8,
        panelClass: 'atlas-tooltip-panel--above',
      },
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: 8,
        panelClass: 'atlas-tooltip-panel--below',
      },
    ]).withPush(true).withViewportMargin(8)
    this.overlayRef = this.overlay.create({
      panelClass: 'atlas-tooltip-panel',
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      maxWidth: 'min(18rem, calc(100vw - 2rem))',
    })
    const injector = Injector.create({
      parent: this.environmentInjector,
      providers: [
        {provide: TOOLTIP_TEXT, useValue: this.text()},
        {provide: TOOLTIP_ID, useValue: this.tooltipId},
      ],
    })

    const surface = this.overlayRef.attach(new ComponentPortal(TooltipSurfaceComponent, null, injector))
    surface.changeDetectorRef.detectChanges()
    this.addDescription()
    this.overlayRef.outsidePointerEvents().subscribe(event => {
      const target = event.target
      if (!(target instanceof Node) || !this.element.nativeElement.contains(target)) this.close()
    })
  }

  private close(): void {
    this.cancelHoverTimer()
    this.pinned = false
    this.overlayRef?.dispose()
    this.overlayRef = null
    this.restoreDescription()
  }

  private addDescription(): void {
    const host = this.element.nativeElement
    this.previousDescribedBy = host.getAttribute('aria-describedby')
    const ids = this.previousDescribedBy?.split(/\s+/).filter(Boolean) ?? []
    host.setAttribute('aria-describedby', [...ids, this.tooltipId].join(' '))
    this.descriptionAttached = true
  }

  private restoreDescription(): void {
    if (!this.descriptionAttached) return
    const host = this.element.nativeElement
    if (this.previousDescribedBy === null) host.removeAttribute('aria-describedby')
    else host.setAttribute('aria-describedby', this.previousDescribedBy)
    this.descriptionAttached = false
    this.previousDescribedBy = null
  }

  private cancelHoverTimer(): void {
    if (this.hoverTimer === null) return
    clearTimeout(this.hoverTimer)
    this.hoverTimer = null
  }
}
