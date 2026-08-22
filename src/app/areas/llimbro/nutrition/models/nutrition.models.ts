import {Database} from '@platform/supabase/database.types';

/**
 * Imagen de un alimento cacheada en memoria junto con la versión almacenada en Supabase.
 */
export type NutritionIngredientImage = {
  src?: Blob | MediaSource
  ingredientId: number
  lastModified: string
}

export type NutritionIngredient = Database['public']['Tables']['nutrition_ingredient']['Row']
export type NutritionIngredientListItem = NutritionIngredient & {image?: string}
export type NutritionIntake = Database['public']['Tables']['nutrition_intake']['Update']
export type NutritionIntakeWithTotals = Database['public']['Views']['nutrition_intake_with_totals']['Row']
export type NutritionObjectiveTotals = Database['public']['Views']['nutrition_objectives_totals']['Row']
export type NutritionObjectiveLevel = Database['public']['Enums']['nutrition_objetive_levels']
export type NutritionObjective = Database['public']['Tables']['nutrition_objective']['Row']

export type NutritionIntakeWithIngredient = {
  date: string
  id: number
  id_user: string
  ingredient: number
  quantity_in_grams: number | null
  nutrition_ingredient: NutritionIngredient
  units: number | null
}
