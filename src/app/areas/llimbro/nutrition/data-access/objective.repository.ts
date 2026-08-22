import {Injectable} from '@angular/core';
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {AuthService} from '@platform/auth/auth.service';
import {LOGGER_COLORS, LoggerService} from "@platform/logging/logger.service"
import {NutritionObjective} from "@areas/llimbro/nutrition/models/nutrition.models"

@Injectable()
export class ObjectiveRepository {

  private readonly entity = 'nutrition_objective'

  constructor(private supabase: SupabaseClientService, private auth: AuthService, private logger: LoggerService) {
    this.logger.setConfig(ObjectiveRepository.name, LOGGER_COLORS.API)
  }

  /* LECTURA */
  public async readObjectives(): Promise<NutritionObjective[]> {
    this.logger.log('Reading all objectives... ')

    const query = await this.supabase.client.from(this.entity).select('*')

    if (!!query.error) {
      this.logger.error('Error getting objectives... ', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from all objectives... ', query.data)

    return query.data
  }
  /* GUARDADO */

  public async saveObjectiveList(objectiveList: NutritionObjective[]) {
    this.logger.log('Saving objective list... ', objectiveList)

    objectiveList = objectiveList.map(objective => ({...objective, id_user: this.auth.requireUserId()}))
    const query = await this.supabase.client.from(this.entity).upsert(objectiveList).select()

    if (!!query.error) {
      this.logger.error('Error saving objective list... ', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from saving objective list... ', query.data)

    return query.data
  }

}
