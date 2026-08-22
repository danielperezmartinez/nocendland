export const NUTRITION_ASSETS = {
  ingredientStorageFolder: 'nutrition_ingredient',
  defaultIngredientStorageFolder: 'nutrition_ingredient/default',
  defaultIngredientImages: [
    'images/default-ingredients/algodon.png',
    'images/default-ingredients/calabaza.png',
    'images/default-ingredients/champinon.png',
    'images/default-ingredients/chile.png',
    'images/default-ingredients/espinacas.png',
    'images/default-ingredients/papa.png',
    'images/default-ingredients/tomate.png',
    'images/default-ingredients/un-pan.png',
  ],
} as const

export const NUTRITION_LIMITS = {
  caloriesPer100: {min: 0, max: 1000},
  macroPer100: {min: 0, max: 100},
  gramsPerUnit: {min: 0, max: 32767},
  intakeQuantityInGrams: {min: 0, max: 100000},
  intakeUnits: {min: 0, max: 10000},
} as const

export const NUTRITION_TEXT = {
  common: {
    loading: 'Cargando...',
    actions: {
      edit: 'Editar',
    },
  },
  ingredients: {
    name: 'Alimentos',
    formTitleNew: 'Nuevo alimento',
    formTitleEdit: 'Editar alimento',
    formTitleView: 'Alimento',
    formAddPhoto: 'Subir foto',
    listTitle: 'Lista de alimentos',
    selectIngredients: 'Selecciona los alimentos de hoy',
    listAvatarAlt: 'Avatar del alimento en la lista de alimentos',
    formLabels: {
      name: 'Nombre',
      calories: 'Calorías',
      proteins: 'Proteínas',
      fats: 'Grasas',
      carbohydrates: 'Hidratos',
      picture: 'Foto',
      description: 'Descripción',
      gramsPerUnit: 'Gramos por unidad',
    },
  },
  intakes: {
    name: 'Ingesta',
    unitsExplanation: 'Este valor calculará los gramos en base a los gramos por unidad del alimento seleccionado. No es necesario introducirlo.',
  },
  objectives: {
    name: 'Objetivos',
  },
} as const
