import { Injectable } from '@angular/core';
import {NUTRITION_ASSETS} from '../nutrition.constants';

@Injectable({
  providedIn: 'root'
})
export class NutritionResourcesService {

  public getRandomDefaultImageForIngredient(): string {
    const randomIndex = Math.floor(Math.random() * NUTRITION_ASSETS.defaultIngredientImages.length)
    return NUTRITION_ASSETS.defaultIngredientImages[randomIndex]
  }

  public getRandomDefaultIngredientStoragePath(): string {
    const imageIndex = Math.floor(Math.random() * NUTRITION_ASSETS.defaultIngredientImages.length)
    return `${NUTRITION_ASSETS.defaultIngredientStorageFolder}/${imageIndex}.png`
  }
}
