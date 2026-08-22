import { Injectable } from '@angular/core';
import {NutritionObjectiveTotals} from "@areas/llimbro/nutrition/models/nutrition.models"
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {AuthService} from '@platform/auth/auth.service';
import {formatDateForDatabase} from "@shared/utilities/date.utils"

@Injectable()
export class NutritionTotalsRepository {
  private readonly entity = 'nutrition_objectives_totals'

  constructor(private supabase: SupabaseClientService, private auth: AuthService) { }

  /**
   * Función para obtener los registros de cada ingrediente con sus gramos consumidos y las cantidades nutritivas por cada 100 gramos.
   * @private
   * @param date
   */
  public async getIntakeJoinIngredientOnlyValues(date: Date): Promise<NutritionObjectiveTotals[]> {
    console.log('Leyendo nutrition_objectives_totals de la fecha', date)
    const query = await this.supabase.client.from(this.entity)
      .select('*')
      .eq('date', formatDateForDatabase(date))
      .eq('id_user', this.auth.requireUserId())

    if (!!query.error) throw new Error(`${query.error}`)

    console.log('Resultado de leer nutrition_objectives_totals', query.data)

    return query.data
  }
}
