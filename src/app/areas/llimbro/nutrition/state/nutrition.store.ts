import {effect, Injectable, signal} from '@angular/core';
import {
  NutritionIngredient,
  NutritionIngredientImage,
  NutritionIngredientListItem,
  NutritionIntakeWithIngredient,
  NutritionObjective,
  NutritionObjectiveTotals
} from "@areas/llimbro/nutrition/models/nutrition.models"
import {NutritionTotalsRepository} from "@areas/llimbro/nutrition/data-access/nutrition-totals.repository"
import {IngredientRepository} from "@areas/llimbro/nutrition/data-access/ingredient.repository"
import {IntakeRepository} from "@areas/llimbro/nutrition/data-access/intake.repository"
import {ObjectiveRepository} from "@areas/llimbro/nutrition/data-access/objective.repository"
import {NutritionResourcesService} from "@areas/llimbro/nutrition/services/nutrition-resources.service"

@Injectable()
export class NutritionStore {

  private readonly dateSelectedState = signal(new Date())

  // Alimentos
  private readonly ingredientListState = signal<NutritionIngredientListItem[]>([])
  private readonly ingredientImageListState = signal<NutritionIngredientImage[]>([])
  private readonly loadingIngredientListState = signal(false)

  // Ingestas
  private readonly intakeJoinIngredientListState = signal<NutritionIntakeWithIngredient[]>([])
  private readonly loadingIntakeJoinIngredientListState = signal(false)
  private readonly savingIntakeJoinIngredientListState = signal(false)

  // Objetivos
  private readonly objectiveListState = signal<NutritionObjective[]>([])
  private readonly loadingObjectiveListState = signal(false)
  private readonly objectivesState = signal<NutritionObjectiveTotals | undefined>(undefined)
  private readonly objectiveTotalsErrorState = signal(false)

  readonly dateSelected = this.dateSelectedState.asReadonly()
  readonly ingredientList = this.ingredientListState.asReadonly()
  readonly ingredientImageList = this.ingredientImageListState.asReadonly()
  readonly loadingIngredientList = this.loadingIngredientListState.asReadonly()
  readonly intakeJoinIngredientList = this.intakeJoinIngredientListState.asReadonly()
  readonly loadingIntakeJoinIngredientList = this.loadingIntakeJoinIngredientListState.asReadonly()
  readonly savingIntakeJoinIngredientList = this.savingIntakeJoinIngredientListState.asReadonly()
  readonly objectiveList = this.objectiveListState.asReadonly()
  readonly loadingObjectiveList = this.loadingObjectiveListState.asReadonly()
  readonly objectives = this.objectivesState.asReadonly()
  readonly objectiveTotalsError = this.objectiveTotalsErrorState.asReadonly()

  get savingIngredient() {
    return this.ingredientRepository.savingIngredient
  }

  get savingIngredientImage() {
    return this.ingredientRepository.savingIngredientImage
  }

  constructor(
    private ingredientRepository: IngredientRepository,
    private intakeRepository: IntakeRepository,
    private objectiveRepository: ObjectiveRepository,
    private nutritionTotalsRepository: NutritionTotalsRepository,
    private resources: NutritionResourcesService
  ) {
    this.effectDateSelected()
    this.loadIngredientList()
    this.loadObjectiveList()
  }

  public async reloadDateSelectedDependent(): Promise<void> {
    await Promise.all([
      this.loadObjectiveSumByDate(),
      this.loadIntakeJoinIngredientList()
    ])
  }

  public selectDate(date: Date): void {
    this.dateSelectedState.set(date)
  }

  public setSavingIntake(saving: boolean): void {
    this.savingIntakeJoinIngredientListState.set(saving)
  }

  /* ALIMENTOS */

  public readIngredient(ingredientId: number): Promise<NutritionIngredient> {
    return this.ingredientRepository.readIngredientById(ingredientId)
  }

  public async saveIngredient(ingredient: NutritionIngredient): Promise<NutritionIngredient> {
    const savedIngredient = await this.ingredientRepository.saveIngredient(ingredient)
    await this.loadIngredientList()
    return savedIngredient
  }

  public async deleteIngredients(ingredients: NutritionIngredient[]): Promise<void> {
    await this.ingredientRepository.deleteIngredients(ingredients)
    await this.loadIngredientList()
  }

  public async saveIngredientImage(ingredient: NutritionIngredient | undefined, file: File): Promise<void> {
    await this.ingredientRepository.saveIngredientImage(ingredient, file)
    await this.loadIngredientList()
  }

  public async loadIngredientList(): Promise<void> {
    this.loadingIngredientListState.set(true)
    try {
      this.ingredientListState.set(await this.ingredientRepository.readAllIngredients())
      await this.syncIngredientImageList()
    } finally {
      this.loadingIngredientListState.set(false)
    }
  }

  private async syncIngredientImageList(): Promise<void> {
    // Carga la lista de imágenes desde la API
    const loadedImages = await this.ingredientRepository.readIngredientImageList();
    const currentList = this.ingredientImageListState();
    let updatedList: NutritionIngredientImage[] = [...currentList];

    // Añade los nuevos elementos que no existen en ingredientImageList
    loadedImages.forEach(loaded => {
      const ingredientId = Number(loaded.name)
      const exists = currentList.some(img => img.ingredientId === ingredientId);
      if (!exists) {
        updatedList.push({
          ingredientId,
          lastModified: loaded.metadata?.lastModified ?? '',
          src: undefined // Se cargará después si es necesario
        });
      }
    });

    // Array de promesas para cargar imágenes en paralelo
    const promises = updatedList.map(async img => {
      const loaded = loadedImages.find(item => Number(item.name) === img.ingredientId);
      if (!loaded) return img;

      const lastModified = loaded.metadata?.lastModified ?? ''
      if (!img.src || img.lastModified !== lastModified) {
        const src = await this.ingredientRepository.readIngredientImageById(img.ingredientId);
        return {
          ...img,
          src,
          lastModified
        };
      }
      return img;
    });

    updatedList = await Promise.all(promises);

    this.ingredientImageListState.set(updatedList);
    this.updateIngredientListWithImages()
  }

  private updateIngredientListWithImages(): void {
    // Recuperar la lista de ingredientes y la lista de imágenes
    const ingredients = this.ingredientListState();
    const images = this.ingredientImageListState();

    // Actualizar la lista de ingredientes con las imágenes correspondientes
    const updatedList = ingredients.map(ingredient => {
      const imageObj = images.find(img => img.ingredientId == ingredient.id);
      return {
        ...ingredient,
        image: imageObj?.src ? URL.createObjectURL(imageObj.src) : this.resources.getRandomDefaultImageForIngredient()
      };
    });

    this.ingredientListState.set(updatedList);
  }

  /* INGESTAS */
  public async saveIntakeList(intakeList: Parameters<IntakeRepository['saveIntakeList']>[0]) {
    const savedIntakes = await this.intakeRepository.saveIntakeList(intakeList)
    await this.reloadDateSelectedDependent()
    return savedIntakes
  }

  public async saveIntake(intake: Parameters<IntakeRepository['saveIntake']>[0]): Promise<void> {
    this.savingIntakeJoinIngredientListState.set(true)
    try {
      await this.intakeRepository.saveIntake(intake)
      await this.reloadDateSelectedDependent()
    } finally {
      this.savingIntakeJoinIngredientListState.set(false)
    }
  }

  public async deleteIntakes(intakeIdList: number[]): Promise<void> {
    await this.intakeRepository.deleteIntakesByIdList(intakeIdList)
    await this.reloadDateSelectedDependent()
  }

  public async loadIntakeJoinIngredientList(): Promise<void> {
    this.loadingIntakeJoinIngredientListState.set(true)
    return this.intakeRepository.readIntakesJoinIngredientByDate(this.dateSelectedState())
      .then((intakeList: NutritionIntakeWithIngredient[]) => this.intakeJoinIngredientListState.set(intakeList))
      .finally(() => this.loadingIntakeJoinIngredientListState.set(false))
  }

  public async loadObjectiveSumByDate(): Promise<void> {
    this.objectivesState.set(undefined)
    this.objectiveTotalsErrorState.set(false)

    const initialTotals: NutritionObjectiveTotals = {
      calories: 0,
      carbohydrates: 0,
      fats: 0,
      proteins: 0,
      date: '',
      id_user: ''
    }

    try {
      const values = await this.nutritionTotalsRepository.getIntakeJoinIngredientOnlyValues(this.dateSelectedState())
      const totals = values.reduce<NutritionObjectiveTotals>((currentTotals, value) => ({
        ...currentTotals,
        calories: (currentTotals.calories ?? 0) + (value.calories ?? 0),
        carbohydrates: (currentTotals.carbohydrates ?? 0) + (value.carbohydrates ?? 0),
        fats: (currentTotals.fats ?? 0) + (value.fats ?? 0),
        proteins: (currentTotals.proteins ?? 0) + (value.proteins ?? 0),
      }), initialTotals)

      this.objectivesState.set(totals)
    } catch (error) {
      this.objectiveTotalsErrorState.set(true)
      throw error
    }
  }

  /* OBJETIVOS */
  public async saveObjectives(objectiveList: NutritionObjective[]): Promise<void> {
    await this.objectiveRepository.saveObjectiveList(objectiveList)
    await this.loadObjectiveList()
  }

  public async loadObjectiveList(): Promise<void> {
    this.loadingObjectiveListState.set(true)
    try {
      this.objectiveListState.set(await this.objectiveRepository.readObjectives())
    } finally {
      this.loadingObjectiveListState.set(false)
    }
  }

  /* EFECTOS */
  private effectDateSelected(): void {
    effect(() => {
      this.dateSelectedState()
      void this.reloadDateSelectedDependent().catch(() => undefined)
    })
  }
}
