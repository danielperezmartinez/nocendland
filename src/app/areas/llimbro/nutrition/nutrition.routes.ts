import {Routes} from '@angular/router';
import {NutritionStore} from './state/nutrition.store';
import {IngredientRepository} from './data-access/ingredient.repository';
import {IntakeRepository} from './data-access/intake.repository';
import {NutritionTotalsRepository} from './data-access/nutrition-totals.repository';
import {ObjectiveRepository} from './data-access/objective.repository';
import {NutritionLayoutComponent} from './layout/nutrition-layout.component'

export const NUTRITION_ROUTES: Routes = [
  {
    path: '',
    component: NutritionLayoutComponent,
    providers: [
      NutritionStore,
      IngredientRepository,
      IntakeRepository,
      NutritionTotalsRepository,
      ObjectiveRepository,
    ],
    children: [
      {path: '', redirectTo: 'intakes', pathMatch: 'full'},
      {
        path: 'ingredients',
        data: {featureTab: 'ingredients'},
        loadComponent: () => import('./ingredients/pages/ingredients/ingredients.component').then(({IngredientsComponent}) => IngredientsComponent),
      },
      {
        path: 'intakes',
        data: {featureTab: 'intakes'},
        loadComponent: () => import('./intakes/pages/intake/intake.component').then(({IntakeComponent}) => IntakeComponent),
      },
      {
        path: 'objectives',
        data: {featureTab: 'objectives'},
        loadComponent: () => import('./objectives/pages/objectives/objectives.component').then(({ObjectivesComponent}) => ObjectivesComponent),
      },
      {
        path: 'ingredient-form/:id',
        data: {featureTab: 'ingredients', featureSwipe: false},
        loadComponent: () => import('./ingredients/pages/ingredient-form/ingredient-form.component').then(({IngredientFormComponent}) => IngredientFormComponent),
      },
    ],
  },
];
