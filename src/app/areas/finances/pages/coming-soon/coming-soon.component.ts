import {ChangeDetectionStrategy, Component} from '@angular/core'
import {BadgeComponent, BadgeConfig} from '@shared/ui/badge'

@Component({
  selector: 'app-finances-coming-soon',
  imports: [BadgeComponent],
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ComingSoonComponent {
  protected readonly developmentBadge: BadgeConfig = {variant: 'label', label: 'En desarrollo'}
}
