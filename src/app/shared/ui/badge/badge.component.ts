import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core'
import {BadgeConfig} from './badge.types'

@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class BadgeComponent {
  readonly config = input.required<BadgeConfig>()

  protected readonly status = computed(() => this.config().status ?? 'primary')
  protected readonly label = computed(() => {
    const config = this.config()
    return config.variant === 'label' ? config.label : ''
  })
  protected readonly pulsing = computed(() => {
    const config = this.config()
    return config.variant === 'dot' && (config.pulse ?? false)
  })
  protected readonly accessibleLabel = computed(() => {
    const config = this.config()
    if (config.variant === 'dot') return config.ariaLabel
    if (config.variant === 'count') return config.ariaLabel ?? String(config.value)
    return null
  })
  protected readonly countLabel = computed(() => {
    const config = this.config()
    if (config.variant !== 'count') return ''
    const maximum = config.max === undefined ? null : Math.max(0, Math.trunc(config.max))
    const value = maximum !== null && config.value > maximum ? `${maximum}+` : String(config.value)
    return `${config.prefix ?? ''}${value}`
  })
}
