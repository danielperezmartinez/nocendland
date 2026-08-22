import { Injectable } from '@angular/core';
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {AuthService} from '@platform/auth/auth.service';
import {LOGGER_COLORS, LoggerService} from "@platform/logging/logger.service"
import {NutritionIntake, NutritionIntakeWithIngredient} from "@areas/llimbro/nutrition/models/nutrition.models"
import {Database} from '@platform/supabase/database.types';
import {formatDateForDatabase} from '@shared/utilities/date.utils';

type NutritionIntakeInsert = Database['public']['Tables']['nutrition_intake']['Insert']

@Injectable()
export class IntakeRepository {

  private readonly entity = 'nutrition_intake'

  constructor(private supabase: SupabaseClientService, private auth: AuthService, private logger: LoggerService) {
    this.logger.setConfig(IntakeRepository.name, LOGGER_COLORS.API)
  }

  /* LECTURA */

  public async readIntakesJoinIngredientByDate(date: Date): Promise<NutritionIntakeWithIngredient[]> {
    this.logger.log('Reading intakes join ingredient by date: ', date)

    const query = await this.supabase.client
      .from(this.entity)
      .select('*, nutrition_ingredient(*)')
      .eq('date', formatDateForDatabase(date))

    if (!!query.error) {
      this.logger.error('Error in reading intakes join ingredient by date: ', date, query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from intakes join ingredient by date: ', query.data)

    return query.data.sort((a, b) => {
      // Ordena por nombre
      const nameComparison = a.nutrition_ingredient.name.localeCompare(b.nutrition_ingredient.name);
      if (nameComparison !== 0) return nameComparison;
      // Si los nombres son iguales, ordena por ID
      return a.id - b.id;
    })
  }

  /* GUARDADO */

  public async saveIntake(intake: NutritionIntake): Promise<NutritionIntake> {
    this.logger.log('Saving intake... ', intake)

    const update: NutritionIntakeInsert = {
      ...intake,
      id_user: this.auth.requireUserId(),
      ingredient: intake.ingredient!,
    }
    const query = await this.supabase.client.from(this.entity).upsert(update).select().single()

    if (!!query.error) {
      this.logger.error('Error saving intake... ', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from saving intake: ', query.data)

    return query.data
  }

  public async saveIntakeList(intakeList: NutritionIntake[]) {
    this.logger.log('Saving intake list... ', intakeList)

    const updates: NutritionIntakeInsert[] = intakeList.map(intake => ({
      ...intake,
      id_user: this.auth.requireUserId(),
      ingredient: intake.ingredient!,
    }))
    const query = await this.supabase.client.from(this.entity).upsert(updates).select()

    if (!!query.error) {
      this.logger.error('Error saving intake list... ', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from saving intake list... ', query.data)

    return query.data
  }

  /* BORRADO */

  public async deleteIntakesByIdList(intakeIdList: number[]) {
    this.logger.log('Deleting intakes by id list... ', intakeIdList)

    const query = await this.supabase.client.from(this.entity).delete().in('id', intakeIdList)

    if (!!query.error) {
      this.logger.error('Error deleting intake list... ', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result deleting intakes by id list... ', query.data)

    return query.data
  }
}
