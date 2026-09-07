import {Database} from '@platform/supabase/database.types'

export type FinanceSettings = Database['nocendland']['Tables']['finance_settings']['Row']
export type FinanceCategory = Database['nocendland']['Tables']['finance_category']['Row']
export type FinancePeriod = Database['nocendland']['Tables']['finance_period']['Row']
export type FinanceBudgetAllocation = Database['nocendland']['Tables']['finance_budget_allocation']['Row']
export type FinanceRecurringItem = Database['nocendland']['Tables']['finance_recurring_item']['Row']
export type FinanceMovement = Database['nocendland']['Tables']['finance_movement']['Row']
export type FinanceGoal = Database['nocendland']['Tables']['finance_goal']['Row']
export type FinanceGoalContribution = Pick<FinanceMovement, 'amount' | 'goal_id'>

export type FinanceFlowType = 'income' | 'expense' | 'saving'
export type FinanceMovementStatus = 'pending' | 'completed' | 'cancelled'
export type FinanceGoalStatus = 'active' | 'completed' | 'archived'

export type FinanceSettingsDraft = Pick<FinanceSettings, 'currency_code' | 'period_start_day'>

export type FinanceMovementDraft = Pick<
  FinanceMovement,
  'amount' | 'category_id' | 'goal_id' | 'name' | 'notes' | 'occurred_on' | 'scheduled_on' | 'status'
> & Partial<Pick<FinanceMovement, 'id' | 'recurrence_due_on' | 'recurring_item_id'>>

export type FinanceRecurringDraft = Pick<
  FinanceRecurringItem,
  'amount' | 'category_id' | 'due_day' | 'ends_on' | 'goal_id' | 'interval_months' | 'name' | 'notes' | 'starts_on'
> & Partial<Pick<FinanceRecurringItem, 'id'>>

export type FinanceGoalDraft = Pick<
  FinanceGoal,
  'initial_amount' | 'name' | 'notes' | 'status' | 'target_amount' | 'target_date'
> & Partial<Pick<FinanceGoal, 'id'>>

export type FinanceMovementView = FinanceMovement & {
  categoryName: string
  flowType: FinanceFlowType
}

export type FinanceRecurringView = FinanceRecurringItem & {
  categoryName: string
  flowType: FinanceFlowType
  monthlyEquivalent: number
}

export type FinanceGoalView = FinanceGoal & {
  currentAmount: number
  progress: number
}

export type FinanceBudgetRow = {
  category: FinanceCategory
  plannedAmount: number
  actualAmount: number
  committedAmount: number
  allocationId: number | null
}

export type FinanceSummary = {
  available: number
  spent: number
  reserved: number
  projectedRemainder: number
  plannedIncome: number
  plannedExpense: number
  plannedSaving: number
}
