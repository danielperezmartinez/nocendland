import {ChangeDetectionStrategy, Component} from '@angular/core'
import {BadgeComponent, BadgeConfig} from '@shared/ui/badge'

@Component({
  selector: 'app-measurements',
  imports: [BadgeComponent],
  templateUrl: './measurements.component.html',
  styleUrl: './measurements.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MeasurementsComponent {
  protected readonly developmentBadge: BadgeConfig = {variant: 'label', label: 'En desarrollo'}
}
