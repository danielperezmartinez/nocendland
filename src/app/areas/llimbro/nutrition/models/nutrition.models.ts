import {Database} from '@platform/supabase/database.types';

/**
 * Imagen de un alimento cacheada en memoria junto con la versión almacenada en Supabase.
 */
export type NutritionIngredientImage = {
  src?: Blob | MediaSource
  ingredientId: number
  lastModified: string
}

export type NutritionIngredient = Database['nocendland']['Tables']['nutrition_ingredient']['Row']
export type NutritionIngredientListItem = NutritionIngredient & {image?: string}
export type NutritionIntake = Database['nocendland']['Tables']['nutrition_intake']['Update']
export type NutritionIntakeWithTotals = Database['nocendland']['Views']['nutrition_intake_with_totals']['Row']
export type NutritionObjectiveTotals = Database['nocendland']['Views']['nutrition_objectives_totals']['Row']
export type NutritionObjectiveLevel = Database['nocendland']['Enums']['nutrition_objetive_levels']
export type NutritionObjective = Database['nocendland']['Tables']['nutrition_objective']['Row']

export type NutritionIntakeWithIngredient = {
  date: string
  id: number
  id_user: string
  ingredient: number
  quantity_in_grams: number | null
  nutrition_ingredient: NutritionIngredient
  units: number | null
}
