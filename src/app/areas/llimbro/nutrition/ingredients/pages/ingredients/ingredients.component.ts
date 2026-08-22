import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core'
import {NUTRITION_TEXT} from "@areas/llimbro/nutrition/nutrition.constants";
import {NutritionStore} from "@areas/llimbro/nutrition/state/nutrition.store"
import {NutritionIngredientListItem} from '@areas/llimbro/nutrition/models/nutrition.models'
import {NavigationService} from "@shell/navigation/navigation.service"
import {DataListComponent, DataListConfig, DataListItem} from '@shared/ui/data-list'

/**
 * Página de alimentos.
 */
@Component({
    selector: 'app-ingredients',
  imports: [
    DataListComponent
  ],
    templateUrl: './ingredients.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './ingredients.component.scss'
})
export class IngredientsComponent {

  readonly nutritionStore = inject(NutritionStore)
  private readonly navigate = inject(NavigationService)
  protected readonly deleteMode = signal(false)
  protected readonly ingredientListItems = computed<readonly DataListItem<NutritionIngredientListItem>[]>(() =>
    this.nutritionStore.ingredientList().map(ingredient => ({
      id: ingredient.id,
      value: ingredient,
      title: ingredient.name,
      details: [`${ingredient.calories_per_100 ?? 0} kcal / 100 g`],
      imageUrl: ingredient.image,
    })),
  )

  protected readonly ingredientListConfig: DataListConfig<NutritionIngredientListItem> = {
    label: 'Alimentos',
    actions: {
      reload: () => this.nutritionStore.loadIngredientList(),
      confirm: ingredients => this.handleIngredients(ingredients),
    },
    multiple: this.deleteMode,
    showSelectionConfirmation: true,
    confirmationIcon: 'delete',
    loading: this.nutritionStore.loadingIngredientList,
  }

  private handleIngredients(ingredients: readonly NutritionIngredientListItem[]): void {
    if (this.deleteMode()) {
      this.deleteIngredients(ingredients)
      return
    }

    const ingredient = ingredients[0]
    if (ingredient) this.navigateToIngredientForm(ingredient.id.toString())
  }

  private deleteIngredients(ingredients: readonly NutritionIngredientListItem[]): void {
    this.nutritionStore.deleteIngredients([...ingredients])
      .finally(() => this.toggleDeleteMode())
  }

  protected navigateToIngredientForm(ingredientId: string | 'new'): void {
    this.navigate.to('nutrition', 'ingredient-form', ingredientId)
  }

  protected toggleDeleteMode(): void {
    this.deleteMode.update(enabled => !enabled)
  }

  protected readonly text = NUTRITION_TEXT;
}
