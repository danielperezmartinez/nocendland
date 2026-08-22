import {ChangeDetectionStrategy, Component, input} from '@angular/core'

export interface CardData {
  label: string
  value: string | number
}

@Component({
  selector: 'app-card-data',
  imports: [],
  templateUrl: './card-data.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './card-data.component.scss'
})
export class CardDataComponent {
  readonly data = input.required<CardData>()
}
