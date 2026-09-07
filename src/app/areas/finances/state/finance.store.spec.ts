import {TestBed} from '@angular/core/testing'
import {ToastService} from '@shared/ui/toast'
import {FinanceRepository} from '../data-access/finance.repository'
import {FinanceCategory, FinanceMovement, FinancePeriod} from '../models/finance.models'
import {FinanceStore} from './finance.store'

describe('FinanceStore', () => {
  let store: FinanceStore
  let repository: Record<string, ReturnType<typeof vi.fn>>

  beforeEach(async () => {
    repository = {
      ensurePeriod: vi.fn().mockResolvedValue(period()),
      materializePeriod: vi.fn().mockResolvedValue(undefined),
      readSettings: vi.fn().mockResolvedValue({
        id_user: 'user-1', currency_code: 'EUR', period_start_day: 1,
        created_at: '', updated_at: '',
      }),
      readCategories: vi.fn().mockResolvedValue(categories()),
      readRecurringItems: vi.fn().mockResolvedValue([]),
      readGoals: vi.fn().mockResolvedValue([{
        id: 20, id_user: 'user-1', name: 'Colchón', target_amount: 1000,
        initial_amount: 100, target_date: null, status: 'active', notes: null,
        created_at: '', updated_at: '',
      }]),
      readGoalContributions: vi.fn().mockResolvedValue([{goal_id: 20, amount: 200}]),
      readMovements: vi.fn().mockResolvedValue(movements()),
      readAllocations: vi.fn().mockResolvedValue([
        allocation(30, 1, 2500),
        allocation(31, 2, 1000),
        allocation(32, 3, 400),
      ]),
    }

    TestBed.configureTestingModule({
      providers: [
        FinanceStore,
        {provide: FinanceRepository, useValue: repository},
        {provide: ToastService, useValue: {success: vi.fn(), error: vi.fn()}},
      ],
    })
    store = TestBed.inject(FinanceStore)
    await vi.waitFor(() => expect(store.loading()).toBe(false))
  })

  it('derives the monthly overview without duplicating planned and pending values', () => {
    expect(store.summary()).toEqual({
      available: 2600,
      spent: 300,
      reserved: 600,
      projectedRemainder: 1200,
      plannedIncome: 2500,
      plannedExpense: 1000,
      plannedSaving: 400,
    })
  })

  it('derives goal progress from its initial balance and completed contributions', () => {
    expect(store.goalViews()[0]).toMatchObject({currentAmount: 300, progress: 30})
  })

  it('materializes recurring occurrences whenever the selected period opens', () => {
    expect(repository['materializePeriod']).toHaveBeenCalledWith(10)
  })
})

function period(): FinancePeriod {
  return {
    id: 10,
    id_user: 'user-1',
    starts_on: '2026-09-01',
    ends_on: '2026-09-30',
    opening_balance: 100,
    status: 'open',
    closed_at: null,
    created_at: '',
    updated_at: '',
  }
}

function categories(): FinanceCategory[] {
  return [
    category(1, 'Nómina', 'income'),
    category(2, 'Vivienda', 'expense'),
    category(3, 'Ahorro', 'saving'),
  ]
}

function category(id: number, name: string, flowType: FinanceCategory['flow_type']): FinanceCategory {
  return {
    id,
    id_user: 'user-1',
    name,
    flow_type: flowType,
    sort_order: id,
    archived_at: null,
    created_at: '',
    updated_at: '',
  }
}

function movements(): FinanceMovement[] {
  return [
    movement(1, 2, 300, 'completed'),
    movement(2, 2, 200, 'pending'),
    movement(3, 1, 2500, 'pending'),
    movement(4, 3, 400, 'pending'),
    {...movement(5, 3, 200, 'completed'), goal_id: 20},
  ]
}

function movement(id: number, categoryId: number, amount: number, status: FinanceMovement['status']): FinanceMovement {
  return {
    id,
    id_user: 'user-1',
    period_id: 10,
    category_id: categoryId,
    recurring_item_id: null,
    goal_id: null,
    name: `Movimiento ${id}`,
    amount,
    status,
    scheduled_on: '2026-09-05',
    occurred_on: status === 'completed' ? '2026-09-05' : null,
    recurrence_due_on: null,
    notes: null,
    created_at: '',
    updated_at: '',
  }
}

function allocation(id: number, categoryId: number, amount: number) {
  return {
    id,
    id_user: 'user-1',
    period_id: 10,
    category_id: categoryId,
    planned_amount: amount,
    notes: null,
    created_at: '',
    updated_at: '',
  }
}
