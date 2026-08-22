import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms"

import {NUTRITION_TEXT} from "@areas/llimbro/nutrition/nutrition.constants"
import {NutritionObjective, NutritionObjectiveLevel} from "@areas/llimbro/nutrition/models/nutrition.models"
import {selectInputContent} from "@shared/utilities/input.utils"
import {NutritionStore} from "@areas/llimbro/nutrition/state/nutrition.store"
import {DialogRef} from '@shared/ui/dialog'
import {ToastService} from '@shared/ui/toast'

@Component({
  selector: 'app-objective-config',
  imports: [
    ReactiveFormsModule
],
  templateUrl: './objective-config.component.html',
  styleUrl: './objective-config.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ObjectiveConfigComponent {
  protected readonly dialogRef = inject<DialogRef<void>>(DialogRef)
  private readonly toast = inject(ToastService)

  private levels: NutritionObjectiveLevel[] = ['keep', 'good', 'top']
  protected objectiveConfigFormList: FormGroup[] = []

  constructor(
    private formBuilder: FormBuilder,
    private nutritionStore: NutritionStore,
  ) {
    this.buildForm()
  }

  private buildForm(): void {
    this.levels.map((level: NutritionObjectiveLevel) => {
      const objective: NutritionObjective | undefined = this.nutritionStore.objectiveList().find(objective => objective.level === level)
      this.objectiveConfigFormList.push(
        this.formBuilder.group({
          level: [level],
          proteins: [objective?.proteins || 0],
          carbohydrates: [objective?.carbohydrates || 0],
          fats: [objective?.fats || 0],
          calories: [objective?.calories || 0],
        })
      )
    })
  }

  protected async saveObjectiveConfig(): Promise<void> {
    const objectiveList: NutritionObjective[] = this.objectiveConfigFormList.map((form: FormGroup) => {
      return {
        level: form.controls["level"].value,
        proteins: form.controls["proteins"].value,
        carbohydrates: form.controls["carbohydrates"].value,
        fats: form.controls["fats"].value,
        calories: form.controls["calories"].value,
        id_user: ''
      }
    });

    try {
      await this.nutritionStore.saveObjectives(objectiveList)
      this.dialogRef.close()
      this.toast.success('Objetivos guardados', {description: 'Tus referencias nutricionales están al día.'})
    } catch {
      this.toast.error('No se pudieron guardar los objetivos', {
        description: 'Conservamos los valores para que puedas reintentarlo.',
      })
    }
  }

  protected readonly text = NUTRITION_TEXT
  protected readonly selectInputContent = selectInputContent
}
