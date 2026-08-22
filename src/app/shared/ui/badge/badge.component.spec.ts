import {ComponentFixture, TestBed} from '@angular/core/testing'
import {BadgeComponent} from './badge.component'
import {BadgeStatus} from './badge.types'

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [BadgeComponent]}).compileComponents()
    fixture = TestBed.createComponent(BadgeComponent)
  })

  it('renders a label with the primary status by default', () => {
    fixture.componentRef.setInput('config', {variant: 'label', label: 'Fuerza'})
    fixture.detectChanges()

    const badge: HTMLElement = fixture.nativeElement.querySelector('.badge')
    expect(badge.textContent).toContain('Fuerza')
    expect(badge.dataset['status']).toBe('primary')
    expect(badge.querySelector('.badge__marker')).not.toBeNull()
  })

  it('supports every visual status', () => {
    const statuses: BadgeStatus[] = ['primary', 'success', 'warning', 'danger', 'neutral']

    for (const status of statuses) {
      fixture.componentRef.setInput('config', {variant: 'label', label: status, status})
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.badge').dataset.status).toBe(status)
    }
  })

  it('truncates a count and preserves its full accessible value', () => {
    fixture.componentRef.setInput('config', {
      variant: 'count',
      value: 120,
      max: 99,
      prefix: '+',
      ariaLabel: '120 elementos más',
    })
    fixture.detectChanges()

    const badge: HTMLElement = fixture.nativeElement.querySelector('.badge')
    expect(badge.textContent?.trim()).toBe('+99+')
    expect(badge.getAttribute('aria-label')).toBe('120 elementos más')
  })

  it('renders an accessible pulsing dot', () => {
    fixture.componentRef.setInput('config', {variant: 'dot', ariaLabel: 'Disponible', pulse: true})
    fixture.detectChanges()

    const badge: HTMLElement = fixture.nativeElement.querySelector('.badge')
    expect(badge.getAttribute('aria-label')).toBe('Disponible')
    expect(badge.getAttribute('role')).toBe('img')
    expect(badge.querySelector('.badge__dot--pulse')).not.toBeNull()
  })
})
