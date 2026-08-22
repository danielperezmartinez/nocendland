import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core'

@Component({
  selector: 'app-repetitions-input',
  templateUrl: './repetitions-input.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {'class': 'ui-field repetitions-input'},
})
export class RepetitionsInputComponent {
  readonly label = input('Repeticiones')
  readonly repetitions = input<number | null>(null)
  readonly presets = input<readonly number[]>([8, 10, 12])
  readonly repetitionsChange = output<number | null>()

  protected readonly customRepetitions = computed(() =>
    this.isPreset(this.repetitions()) ? '' : (this.repetitions() ?? ''),
  )

  protected selectPreset(repetitions: number): void {
    this.repetitionsChange.emit(repetitions)
  }

  protected updateCustomRepetitions(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value
    const repetitions = rawValue === '' ? null : Math.max(1, Math.trunc(Number(rawValue)))
    this.repetitionsChange.emit(repetitions)
  }

  protected isPreset(repetitions: number | null): boolean {
    return repetitions !== null && this.presets().some(preset => preset === repetitions)
  }
}
