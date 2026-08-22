import {Injectable, signal} from '@angular/core';
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {AuthService} from '@platform/auth/auth.service';
import {LOGGER_COLORS, LoggerService} from "@platform/logging/logger.service"
import {NutritionIngredient} from "@areas/llimbro/nutrition/models/nutrition.models"
import {SupabaseStorageService} from "@platform/supabase/supabase-storage.service"
import {FileObject} from "@supabase/storage-js"

@Injectable()
export class IngredientRepository {
  private readonly savingIngredientState = signal(false)
  private readonly savingIngredientImageState = signal(false)

  readonly savingIngredient = this.savingIngredientState.asReadonly()
  readonly savingIngredientImage = this.savingIngredientImageState.asReadonly()

  private readonly entity = 'nutrition_ingredient'

  constructor(
    private supabase: SupabaseClientService,
    private auth: AuthService,
    private logger: LoggerService,
    private storage: SupabaseStorageService,
  ) {
    this.logger.setConfig(IngredientRepository.name, LOGGER_COLORS.API)
  }

  /* LECTURA */

  public async readAllIngredients(): Promise<NutritionIngredient[]> {
    this.logger.log('Reading all ingredients... ')

    const query = await this.supabase.client.from(this.entity).select('*').order('name')

    if (!!query.error) {
      this.logger.error('Error getting ingredients... ', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from all ingredients... ', query.data)

    return query.data
  }

  public async readIngredientById(ingredientId: number): Promise<NutritionIngredient> {
    this.logger.log('Reading ingredient with id', ingredientId)

    const query = await this.supabase.client.from(this.entity).select('*').eq('id', ingredientId).single()

    if (!!query.error) {
      this.logger.error('Error getting ingredient with id', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from ingredient with id', query.data)

    return query.data
  }

  /* GUARDADO */
  public async saveIngredient(ingredient: NutritionIngredient): Promise<NutritionIngredient> {
    this.logger.log('Saving ingredient... ', ingredient)
    this.savingIngredientState.set(true)

    const update = {...ingredient, id_user: this.auth.requireUserId()}

    const query = await this.supabase.client.from(this.entity).upsert(update).select().single()
    this.savingIngredientState.set(false)

    if (!!query.error) {
      this.logger.error('Error saving ingredient with id', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Ingredient saved successfully.', query.data)

    return query.data
  }

  /* BORRADO */

  public async deleteIngredients(ingredients: NutritionIngredient[]) {
    const ingredientIdsToDelete: number[] = ingredients.map(ingredient => ingredient.id)
    this.logger.log('Deleting ingredients... ', ingredientIdsToDelete)

    const query = await this.supabase.client.from(this.entity).delete().in('id', ingredientIdsToDelete)

    if (!!query.error) {
      this.logger.error('Error deleting ingredients... ', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Deleted ingredient successfully.', query.data)

    return Promise.resolve(query.data)
  }

  /* IMÁGENES */

  /**
   * Devuelve la imagen de un ingrediente por su ID.
   * Lo carga desde el bucket de Supabase teniendo en cuenta la entidad y el usuario
   * @param ingredientId
   */
  public async readIngredientImageById(ingredientId: number): Promise<Blob> {
    this.logger.log('Reading ingredient image with id', ingredientId)

    const query = await this.storage.readImage(`${this.entity}/${this.auth.requireUserId()}/${ingredientId}`)

    if (!!query.error) {
      this.logger.error('Error getting ingredient image with id', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from ingredient image with id', query.data)

    return query.data
  }

  /**
   * Lee todas las imágenes de los ingredientes del usuario actual.
   */
  public async readIngredientImageList(): Promise<FileObject[]> {
    this.logger.log('Reading all images of ingredients... ')

    const query = await this.storage.readImages(`${this.entity}/${this.auth.requireUserId()}/`)

    if (!!query.error) {
      this.logger.error('Error getting images of ingredients... ', query.error)
      return Promise.reject(query.error)
    }

    this.logger.log('Result from all images of ingredients... ', query.data)

    return query.data
  }

  public async saveIngredientImage(ingredient: NutritionIngredient | undefined, file: File) {
    if (!ingredient) return
    this.savingIngredientImageState.set(true)

    console.log('Uploading image to ingredient: ', ingredient)

    return await this.storage.uploadImage(`${this.entity}/${this.auth.requireUserId()}/${ingredient.id}`, file)
      .then(imageData => imageData)
      .catch(error => console.error('Error image to ingredient: ', ingredient, error))
    .finally(() => this.savingIngredientImageState.set(false))
  }
}
