import {TestBed} from '@angular/core/testing'
import {IngredientRepository} from '@areas/llimbro/nutrition/data-access/ingredient.repository'
import {IntakeRepository} from '@areas/llimbro/nutrition/data-access/intake.repository'
import {NutritionTotalsRepository} from '@areas/llimbro/nutrition/data-access/nutrition-totals.repository'
import {ObjectiveRepository} from '@areas/llimbro/nutrition/data-access/objective.repository'
import {NutritionResourcesService} from '@areas/llimbro/nutrition/services/nutrition-resources.service'
import {NutritionStore} from './nutrition.store'

describe('NutritionStore', () => {
  let store: NutritionStore
  let totalsRepository: {getIntakeJoinIngredientOnlyValues: ReturnType<typeof vi.fn>}

  beforeEach(() => {
    totalsRepository = {
      getIntakeJoinIngredientOnlyValues: vi.fn().mockResolvedValue([]),
    }

    TestBed.configureTestingModule({
      providers: [
        NutritionStore,
        {
          provide: IngredientRepository,
          useValue: {
            savingIngredient: () => false,
            savingIngredientImage: () => false,
            readAllIngredients: vi.fn().mockResolvedValue([]),
            readIngredientImageList: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: IntakeRepository,
          useValue: {readIntakesJoinIngredientByDate: vi.fn().mockResolvedValue([])},
        },
        {
          provide: ObjectiveRepository,
          useValue: {readObjectives: vi.fn().mockResolvedValue([])},
        },
        {provide: NutritionTotalsRepository, useValue: totalsRepository},
        {
          provide: NutritionResourcesService,
          useValue: {getRandomDefaultImageForIngredient: () => ''},
        },
      ],
    })

    store = TestBed.inject(NutritionStore)
  })

  it('sums the nutritional totals returned for the selected date', async () => {
    totalsRepository.getIntakeJoinIngredientOnlyValues.mockResolvedValue([
      {calories: 100, proteins: 10, fats: 5, carbohydrates: 20, date: '2026-08-22', id_user: 'user'},
      {calories: 50, proteins: null, fats: 2, carbohydrates: 5, date: '2026-08-22', id_user: 'user'},
    ])

    await store.loadObjectiveSumByDate()

    expect(store.objectives()).toEqual({
      calories: 150,
      proteins: 10,
      fats: 7,
      carbohydrates: 25,
      date: '',
      id_user: '',
    })
    expect(store.objectiveTotalsError()).toBe(false)
  })

  it('uses zero totals when the selected date has no intakes', async () => {
    totalsRepository.getIntakeJoinIngredientOnlyValues.mockResolvedValue([])

    await store.loadObjectiveSumByDate()

    expect(store.objectives()).toEqual({
      calories: 0,
      proteins: 0,
      fats: 0,
      carbohydrates: 0,
      date: '',
      id_user: '',
    })
  })

  it('clears stale totals and exposes an error when the query fails', async () => {
    totalsRepository.getIntakeJoinIngredientOnlyValues.mockResolvedValue([
      {calories: 100, proteins: 10, fats: 5, carbohydrates: 20, date: '2026-08-22', id_user: 'user'},
    ])
    await store.loadObjectiveSumByDate()
    totalsRepository.getIntakeJoinIngredientOnlyValues.mockRejectedValue(new Error('bigint out of range'))

    await expect(store.loadObjectiveSumByDate()).rejects.toThrow('bigint out of range')

    expect(store.objectives()).toBeUndefined()
    expect(store.objectiveTotalsError()).toBe(true)
  })
})
