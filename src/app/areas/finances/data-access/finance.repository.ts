import {Injectable} from '@angular/core'
import {AuthService} from '@platform/auth/auth.service'
import {SupabaseClientService} from '@platform/supabase/supabase-client.service'
import {
  FinanceBudgetAllocation,
  FinanceGoal,
  FinanceGoalContribution,
  FinanceGoalDraft,
  FinanceMovement,
  FinanceMovementDraft,
  FinancePeriod,
  FinanceRecurringDraft,
  FinanceRecurringItem,
  FinanceSettings,
  FinanceSettingsDraft,
  FinanceCategory,
} from '../models/finance.models'

@Injectable()
export class FinanceRepository {
  constructor(
    private readonly supabase: SupabaseClientService,
    private readonly auth: AuthService,
  ) {}

  async ensurePeriod(targetDate: string): Promise<FinancePeriod> {
    const {data, error} = await this.supabase.client.rpc('ensure_finance_period', {target_date: targetDate})
    if (error) throw error
    return data
  }

  async materializePeriod(periodId: number): Promise<void> {
    const {error} = await this.supabase.client.rpc('materialize_finance_period', {target_period_id: periodId})
    if (error) throw error
  }

  async readSettings(): Promise<FinanceSettings> {
    const {data, error} = await this.supabase.client
      .from('finance_settings')
      .select('*')
      .eq('id_user', this.auth.requireUserId())
      .single()
    if (error) throw error
    return data
  }

  async readCategories(): Promise<FinanceCategory[]> {
    const {data, error} = await this.supabase.client
      .from('finance_category')
      .select('*')
      .eq('id_user', this.auth.requireUserId())
      .is('archived_at', null)
      .order('sort_order')
      .order('name')
    if (error) throw error
    return data
  }

  async readMovements(periodId: number): Promise<FinanceMovement[]> {
    const {data, error} = await this.supabase.client
      .from('finance_movement')
      .select('*')
      .eq('id_user', this.auth.requireUserId())
      .eq('period_id', periodId)
      .order('scheduled_on', {ascending: false})
      .order('id', {ascending: false})
    if (error) throw error
    return data
  }

  async readRecurringItems(): Promise<FinanceRecurringItem[]> {
    const {data, error} = await this.supabase.client
      .from('finance_recurring_item')
      .select('*')
      .eq('id_user', this.auth.requireUserId())
      .is('archived_at', null)
      .order('due_day')
      .order('name')
    if (error) throw error
    return data
  }

  async readGoals(): Promise<FinanceGoal[]> {
    const {data, error} = await this.supabase.client
      .from('finance_goal')
      .select('*')
      .eq('id_user', this.auth.requireUserId())
      .neq('status', 'archived')
      .order('target_date', {ascending: true, nullsFirst: false})
      .order('name')
    if (error) throw error
    return data
  }

  async readGoalContributions(): Promise<FinanceGoalContribution[]> {
    const {data, error} = await this.supabase.client
      .from('finance_movement')
      .select('amount, goal_id')
      .eq('id_user', this.auth.requireUserId())
      .eq('status', 'completed')
      .not('goal_id', 'is', null)
    if (error) throw error
    return data
  }

  async readAllocations(periodId: number): Promise<FinanceBudgetAllocation[]> {
    const {data, error} = await this.supabase.client
      .from('finance_budget_allocation')
      .select('*')
      .eq('id_user', this.auth.requireUserId())
      .eq('period_id', periodId)
    if (error) throw error
    return data
  }

  async saveSettings(draft: FinanceSettingsDraft): Promise<FinanceSettings> {
    const {data, error} = await this.supabase.client
      .from('finance_settings')
      .upsert({...draft, id_user: this.auth.requireUserId()}, {onConflict: 'id_user'})
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  async saveMovement(periodId: number, draft: FinanceMovementDraft): Promise<FinanceMovement> {
    const payload = {...draft, id_user: this.auth.requireUserId(), period_id: periodId}
    const {data, error} = await this.supabase.client
      .from('finance_movement')
      .upsert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  async deleteMovement(movementId: number): Promise<void> {
    const {error} = await this.supabase.client
      .from('finance_movement')
      .delete()
      .eq('id', movementId)
      .eq('id_user', this.auth.requireUserId())
    if (error) throw error
  }

  async saveRecurringItem(draft: FinanceRecurringDraft): Promise<FinanceRecurringItem> {
    const {data, error} = await this.supabase.client
      .from('finance_recurring_item')
      .upsert({...draft, id_user: this.auth.requireUserId()})
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  async archiveRecurringItem(itemId: number): Promise<void> {
    const {error} = await this.supabase.client
      .from('finance_recurring_item')
      .update({archived_at: new Date().toISOString()})
      .eq('id', itemId)
      .eq('id_user', this.auth.requireUserId())
    if (error) throw error
  }

  async saveGoal(draft: FinanceGoalDraft): Promise<FinanceGoal> {
    const {data, error} = await this.supabase.client
      .from('finance_goal')
      .upsert({...draft, id_user: this.auth.requireUserId()})
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  async archiveGoal(goalId: number): Promise<void> {
    const {error} = await this.supabase.client
      .from('finance_goal')
      .update({status: 'archived'})
      .eq('id', goalId)
      .eq('id_user', this.auth.requireUserId())
    if (error) throw error
  }

  async saveOpeningBalance(periodId: number, openingBalance: number): Promise<void> {
    const {error} = await this.supabase.client
      .from('finance_period')
      .update({opening_balance: openingBalance})
      .eq('id', periodId)
      .eq('id_user', this.auth.requireUserId())
    if (error) throw error
  }

  async saveAllocations(periodId: number, allocations: ReadonlyMap<number, number>): Promise<void> {
    const idUser = this.auth.requireUserId()
    const payload = [...allocations].map(([categoryId, plannedAmount]) => ({
      category_id: categoryId,
      id_user: idUser,
      period_id: periodId,
      planned_amount: plannedAmount,
    }))
    if (payload.length === 0) return

    const {error} = await this.supabase.client
      .from('finance_budget_allocation')
      .upsert(payload, {onConflict: 'id_user,period_id,category_id'})
    if (error) throw error
  }
}
