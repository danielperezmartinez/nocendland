import {ChangeDetectionStrategy, Component, input} from '@angular/core'
import {RouterLink} from '@angular/router'
import {FeatureTabItem} from './feature-tab-bar.models'

@Component({
  selector: 'app-feature-tab-bar',
  imports: [RouterLink],
  templateUrl: './feature-tab-bar.component.html',
  styleUrl: './feature-tab-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class FeatureTabBarComponent<TId extends string = string> {
  readonly items = input.required<readonly FeatureTabItem<TId>[]>()
  readonly activeId = input<TId | null>(null)
  readonly label = input('Navegación de la sección')
}
