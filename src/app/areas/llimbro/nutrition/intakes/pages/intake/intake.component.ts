import {ChangeDetectionStrategy, Component, computed, inject, Injector, signal} from '@angular/core'
import {ReactiveFormsModule} from "@angular/forms"
import {CalendarComponent} from '@shared/ui/calendar'
import {DataListComponent, DataListConfig, DataListItem} from '@shared/ui/data-list'
import {DialogService} from '@shared/ui/dialog'
import {ToastService} from '@shared/ui/toast'
import {NutritionStore} from "@areas/llimbro/nutrition/state/nutrition.store"
import {NutritionIngredientListItem, NutritionIntake, NutritionIntakeWithIngredient} from "@areas/llimbro/nutrition/models/nutrition.models"
import {formatDateForDatabase, formatDateForDisplay} from "@shared/utilities/date.utils"
import {IntakeViewerComponent} from '@areas/llimbro/nutrition/intakes/ui/intake-viewer/intake-viewer.component';

@Component({
  selector: 'app-intake',
  imports: [
    ReactiveFormsModule,
    CalendarComponent,
    DataListComponent,
  ],
  templateUrl: './intake.component.html',
  styleUrl: './intake.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class IntakeComponent {

  private readonly dialog = inject(DialogService)
  private readonly injector = inject(Injector)
  private readonly toast = inject(ToastService)
  protected readonly nutritionStore = inject(NutritionStore)
  protected readonly multiSelection = signal(true)
  protected readonly deleteMode = signal(false)
  protected readonly selectingIngredients = signal(false)
  protected readonly ingredientListItems = computed<readonly DataListItem<NutritionIngredientListItem>[]>(() =>
    this.nutritionStore.ingredientList().map(ingredient => ({
      id: ingredient.id,
      value: ingredient,
      title: ingredient.name,
      imageUrl: ingredient.image,
    })),
  )
  protected readonly intakeListItems = computed<readonly DataListItem<NutritionIntakeWithIngredient>[]>(() =>
    this.nutritionStore.intakeJoinIngredientList().map(intake => ({
      id: intake.id,
      value: intake,
      title: intake.nutrition_ingredient.name,
      details: [`${intake.quantity_in_grams ?? 0} g`],
      imageUrl: intake.nutrition_ingredient.image_route,
    })),
  )

  protected readonly selectIngredientListConfig: DataListConfig<NutritionIngredientListItem> = {
    label: 'Alimentos disponibles',
    actions: {
      reload: () => this.reloadIngredientList(),
      confirm: ingredients => this.saveIntakes(ingredients),
    },
    multiple: this.multiSelection,
    showSelectionConfirmation: true,
    confirmationIcon: 'add',
    loading: this.nutritionStore.loadingIngredientList,
  }

  protected readonly intakeListConfig: DataListConfig<NutritionIntakeWithIngredient> = {
    label: 'Ingestas del día',
    actions: {
      reload: () => this.reloadIntakeJoinIngredientList(),
      confirm: intakes => this.handleIntakeSelection(intakes),
    },
    multiple: this.deleteMode,
    showSelectionConfirmation: true,
    confirmationIcon: 'delete',
    loading: this.nutritionStore.loadingIntakeJoinIngredientList,
  }

  protected dateSelected(dateSelected: Date): void {
    this.nutritionStore.selectDate(dateSelected)
  }

  private reloadIngredientList(): void {
    this.nutritionStore.loadIngredientList()
  }

  private reloadIntakeJoinIngredientList(): void {
    this.nutritionStore.loadIntakeJoinIngredientList()
  }

  private async saveIntakes(ingredients: readonly NutritionIngredientListItem[]): Promise<void> {
    let intakes: NutritionIntake[] = ingredients.map(ingredient => {
      let intake: NutritionIntake = {
        date: formatDateForDatabase(this.nutritionStore.dateSelected()),
        ingredient: ingredient.id
      }

      return intake
    })

    let intakesSaved: NutritionIntake[]
    try {
      intakesSaved = await this.nutritionStore.saveIntakeList(intakes)
      this.selectingIngredients.set(false)
      await this.nutritionStore.loadIntakeJoinIngredientList()
      this.toast.success(ingredients.length === 1 ? 'Ingesta añadida' : 'Ingestas añadidas', {
        description: `${ingredients.length} ${ingredients.length === 1 ? 'alimento registrado' : 'alimentos registrados'}.`,
      })
    } catch {
      this.toast.error('No se pudieron añadir las ingestas', {
        description: 'Mantendremos abierta la selección para que puedas reintentarlo.',
      })
      return
    }

    // Si solo hay un intake, lo abrimos directamente.
    if (intakesSaved.length === 1) {
      const newIntakeIndex: number = this.nutritionStore.intakeJoinIngredientList().findIndex((intake: NutritionIntakeWithIngredient): boolean => intake.id === intakesSaved[0].id)
      if (newIntakeIndex < 0) return
      this.openIntakeDialog(newIntakeIndex)
    }
  }

  /** Abre el detalle de la ingesta seleccionada o elimina la selección activa. */
  private handleIntakeSelection(intakes: readonly NutritionIntakeWithIngredient[]): void {
    if (this.deleteMode()) {
      void this.nutritionStore.deleteIntakes(intakes.map(intake => intake.id))
      return
    }

    const selectedIntake = intakes[0]
    const index = this.nutritionStore.intakeJoinIngredientList().findIndex(intake => intake.id === selectedIntake?.id)
    if (index >= 0) this.openIntakeDialog(index)
  }

  protected readonly formatDateForDisplay = formatDateForDisplay

  public openIntakeDialog(currentIndex: number): void {
    this.dialog.open<IntakeViewerComponent, {currentIndex: number}>(IntakeViewerComponent, {
      width: 'min(40rem, calc(100vw - 2rem))',
      data: {currentIndex},
      injector: this.injector,
    }).afterClosed.subscribe(() => {
      this.nutritionStore.loadIntakeJoinIngredientList()
    })
  }

}
