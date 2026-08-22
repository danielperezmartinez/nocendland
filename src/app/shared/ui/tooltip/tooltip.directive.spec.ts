import {OverlayContainer} from '@angular/cdk/overlay'
import {Component} from '@angular/core'
import {ComponentFixture, TestBed} from '@angular/core/testing'
import {TooltipDirective} from './tooltip.directive'

@Component({
  imports: [TooltipDirective],
  template: '<button type="button" appTooltip="Explicación de prueba">Indicador</button>',
})
class TooltipHostComponent {}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<TooltipHostComponent>
  let button: HTMLButtonElement
  let overlayElement: HTMLElement

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [TooltipHostComponent]})
    fixture = TestBed.createComponent(TooltipHostComponent)
    fixture.detectChanges()
    button = fixture.nativeElement.querySelector('button')
    overlayElement = TestBed.inject(OverlayContainer).getContainerElement()
  })

  afterEach(() => fixture.destroy())

  it('opens after a short mouse hover and restores aria-describedby on leave', () => {
    vi.useFakeTimers()
    try {
      button.dispatchEvent(new PointerEvent('pointerenter', {pointerType: 'mouse'}))
      vi.advanceTimersByTime(249)
      expect(overlayElement.querySelector('[role="tooltip"]')).toBeNull()

      vi.advanceTimersByTime(1)
      const tooltip: HTMLElement | null = overlayElement.querySelector('[role="tooltip"]')
      expect(tooltip?.textContent).toContain('Explicación de prueba')
      expect(button.getAttribute('aria-describedby')).toBe(tooltip!.id)

      button.dispatchEvent(new PointerEvent('pointerleave', {pointerType: 'mouse'}))
      expect(overlayElement.querySelector('[role="tooltip"]')).toBeNull()
      expect(button.hasAttribute('aria-describedby')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('opens immediately on focus and closes on blur', () => {
    button.dispatchEvent(new FocusEvent('focusin'))
    expect(overlayElement.querySelector('[role="tooltip"]')).not.toBeNull()

    button.dispatchEvent(new FocusEvent('focusout'))
    expect(overlayElement.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('pins on click and closes on a second click', () => {
    button.click()
    expect(overlayElement.querySelector('[role="tooltip"]')).not.toBeNull()

    button.click()
    expect(overlayElement.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('closes a pinned tooltip on an outside pointer event or Escape', () => {
    button.click()
    document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}))
    document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}))
    expect(overlayElement.querySelector('[role="tooltip"]')).toBeNull()

    button.click()
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
    expect(overlayElement.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('cleans up the overlay when its host is destroyed', () => {
    button.click()
    fixture.destroy()
    expect(overlayElement.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('preserves an existing description when closed before opening', () => {
    button.setAttribute('aria-describedby', 'existing-description')
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))

    expect(button.getAttribute('aria-describedby')).toBe('existing-description')
  })
})
