import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  Signal,
  signal,
  viewChild,
  WritableSignal,
  ChangeDetectionStrategy
} from '@angular/core';
import {NutritionStore} from "@areas/llimbro/nutrition/state/nutrition.store"
import {FormsModule} from "@angular/forms"
import {NutritionIntake, NutritionIntakeWithIngredient} from "@areas/llimbro/nutrition/models/nutrition.models"
import {CardDataComponent} from '@shared/ui/card-data'
import {DIALOG_DATA, DialogRef} from '@shared/ui/dialog'
import {UtilService} from "@shared/utilities/util.service"
import {MathService} from "@shared/utilities/math.service"
import {NUTRITION_LIMITS, NUTRITION_TEXT} from "@areas/llimbro/nutrition/nutrition.constants"

@Component({
  selector: 'app-intake-viewer',
  imports: [
    FormsModule,
    CardDataComponent,
  ],
  templateUrl: './intake-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './intake-viewer.component.scss'
})
export class IntakeViewerComponent implements OnDestroy {
  protected readonly data = inject(DIALOG_DATA) as {currentIndex: number}
  protected readonly dialogRef = inject<DialogRef<void>>(DialogRef)
  protected currentIndex: WritableSignal<number> = signal(0)
  protected readonly limits = NUTRITION_LIMITS

  protected inputQuantity: Signal<ElementRef | undefined> = viewChild<ElementRef>('inputQuantity')

  constructor(
    protected nutritionStore: NutritionStore,
    private util: UtilService,
    protected math: MathService,
  ) {
    this.currentIndex.set(this.data.currentIndex) // Asignamos el currentIndex
    this.effectCurrentIndex()
    this.effectInputQuantity()
  }

  ngOnDestroy(): void {
    this.util.cancelDebounce()
  }

  get currentIntakeJoinIngredient(): NutritionIntakeWithIngredient {
    return this.nutritionStore.intakeJoinIngredientList()[this.currentIndex()]
  }

  getPrevIngredientName(): string {
    let prevIndex = (this.currentIndex() === 0) ? this.nutritionStore.intakeJoinIngredientList().length - 1 : this.currentIndex() - 1;
    return this.nutritionStore.intakeJoinIngredientList()[prevIndex]?.nutrition_ingredient.name || '';
  }

  getNextIngredientName(): string {
    let nextIndex = (this.currentIndex() === this.nutritionStore.intakeJoinIngredientList().length - 1) ? 0 : this.currentIndex() + 1;
    return this.nutritionStore.intakeJoinIngredientList()[nextIndex]?.nutrition_ingredient.name || '';
  }

  prevIngredient() {
    this.currentIndex.set((this.currentIndex() === 0)
      ? this.nutritionStore.intakeJoinIngredientList().length - 1  // Si está en el primero, va al último
      : this.currentIndex() - 1)
  }

  nextIngredient() {
    this.currentIndex.set((this.currentIndex() === this.nutritionStore.intakeJoinIngredientList().length - 1)
      ? 0  // Si está en el último, vuelve al primero
      : this.currentIndex() + 1)
  }

  saveChanges(valid: boolean | null = true) {
    if (valid !== true) return

    this.util.debounce(() => {
      const {nutrition_ingredient: ingredient, ...intake} = structuredClone(this.currentIntakeJoinIngredient)
      void this.nutritionStore.saveIntake({...intake, ingredient: ingredient.id} as NutritionIntake)
    }, 1000)
  }

  private selectInputQuantity(): void {
    // Si la cantidad es mayor a 0, no seleccionamos el input
    if (!!this.currentIntakeJoinIngredient.quantity_in_grams && this.currentIntakeJoinIngredient.quantity_in_grams > 0) return

    setTimeout(() => {
      this.inputQuantity()?.nativeElement.focus()
      this.inputQuantity()?.nativeElement.select()
    })
  }

  protected calculateQuantityInGrams(valid: boolean | null = true): void {
    if (valid !== true) return

    const units: number | null = this.currentIntakeJoinIngredient.units
    if (!units) return

    console.log('Calculando cantidad en gramos...', units)

    this.currentIntakeJoinIngredient.quantity_in_grams = (this.currentIntakeJoinIngredient.nutrition_ingredient.grams_per_unit || 0) * units
    this.saveChanges(this.currentIntakeJoinIngredient.quantity_in_grams <= NUTRITION_LIMITS.intakeQuantityInGrams.max)
  }

  /* EFECTOS */
  private effectCurrentIndex(): void {
    effect(() => {
      this.currentIndex()
      this.selectInputQuantity()
    })
  }

  private effectInputQuantity(): void {
    effect(() => {
      this.inputQuantity()
      this.selectInputQuantity()
    })
  }

  protected readonly input = input
  protected readonly parseInt = parseInt
  protected readonly text = NUTRITION_TEXT
}
