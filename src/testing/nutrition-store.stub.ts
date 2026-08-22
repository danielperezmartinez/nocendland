import {signal} from '@angular/core';

export function createNutritionStoreStub() {
  return {
    dateSelected: signal(new Date(2026, 0, 1)),
    ingredientList: signal([]),
    ingredientImageList: signal([]),
    loadingIngredientList: signal(false),
    intakeJoinIngredientList: signal([{
      id: 1,
      quantity_in_grams: 0,
      units: 0,
      nutrition_ingredient: {
        id: 1,
        name: 'Test',
        description: '',
        image_route: '',
        calories_per_100: 0,
        proteins_per_100: 0,
        carbohydrates_per_100: 0,
        fats_per_100: 0,
        grams_per_unit: 0,
      }
    }]),
    loadingIntakeJoinIngredientList: signal(false),
    savingIntakeJoinIngredientList: signal(false),
    savingIngredient: signal(false),
    savingIngredientImage: signal(false),
    objectiveList: signal([]),
    loadingObjectiveList: signal(false),
    objectives: signal(undefined),
    objectiveTotalsError: signal(false),
    loadIngredientList: () => undefined,
    loadObjectiveList: () => undefined,
    loadIntakeJoinIngredientList: async () => undefined,
    loadObjectiveSumByDate: async () => undefined,
    reloadDateSelectedDependent: async () => undefined,
    selectDate: () => undefined,
    readIngredient: async () => undefined,
    saveIngredient: async (ingredient: unknown) => ingredient,
    deleteIngredients: async () => undefined,
    saveIngredientImage: async () => undefined,
    saveIntakeList: async () => [],
    saveIntake: async () => undefined,
    deleteIntakes: async () => undefined,
    saveObjectives: async () => undefined,
  };
}
