import {ChangeDetectionStrategy, Component, computed, Injector} from '@angular/core';
import {NutritionStore} from "@areas/llimbro/nutrition/state/nutrition.store"
import {DialogService} from '@shared/ui/dialog'
import {ProgressViewerConfig, ProgressViewerComponent} from '@shared/ui/progress-viewer'
import {NUTRITION_TEXT} from "@areas/llimbro/nutrition/nutrition.constants"
import {NavigationService} from "@shell/navigation/navigation.service"
import {ObjectiveConfigComponent} from '@areas/llimbro/nutrition/objectives/ui/objective-config/objective-config.component';
import {NutritionObjective} from "@areas/llimbro/nutrition/models/nutrition.models"

@Component({
  selector: 'app-objectives',
  imports: [
    ProgressViewerComponent,
  ],
  templateUrl: './objectives.component.html',
  styleUrl: './objectives.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ObjectivesComponent {

  private readonly formLabels = NUTRITION_TEXT.ingredients.formLabels
  protected readonly progressConfigList = computed<ProgressViewerConfig[]>(() => {
    const totals = this.nutritionStore.objectives()
    const objective = this.nutritionStore.objectiveList().find(item => item.level === 'keep')
    if (!totals) return []

    return [
      {title: this.formLabels.calories, value: Math.round(totals.calories ?? 0), objective: objective?.calories ?? 0},
      {title: this.formLabels.proteins, value: Math.round(totals.proteins ?? 0), objective: objective?.proteins ?? 0},
      {title: this.formLabels.carbohydrates, value: Math.round(totals.carbohydrates ?? 0), objective: objective?.carbohydrates ?? 0},
      {title: this.formLabels.fats, value: Math.round(totals.fats ?? 0), objective: objective?.fats ?? 0},
    ]
  })

  constructor(
    protected nutritionStore: NutritionStore,
    protected navigation: NavigationService,
    private dialog: DialogService,
    private injector: Injector,
  ) {}

  protected openDialogObjectiveConfig(): void {
    this.dialog.open(ObjectiveConfigComponent, {injector: this.injector})
  }

  protected readonly text = NUTRITION_TEXT
}
