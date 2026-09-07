import {computed, Injectable, signal} from '@angular/core'
import {ToastService} from '@shared/ui/toast'
import {FinanceRepository} from '../data-access/finance.repository'
import {
  FinanceBudgetAllocation,
  FinanceBudgetRow,
  FinanceCategory,
  FinanceFlowType,
  FinanceGoal,
  FinanceGoalContribution,
  FinanceGoalDraft,
  FinanceGoalView,
  FinanceMovement,
  FinanceMovementDraft,
  FinanceMovementView,
  FinancePeriod,
  FinanceRecurringDraft,
  FinanceRecurringItem,
  FinanceRecurringView,
  FinanceSettings,
  FinanceSettingsDraft,
  FinanceSummary,
} from '../models/finance.models'

@Injectable()
export class FinanceStore {
  private readonly settingsState = signal<FinanceSettings | null>(null)
  private readonly periodState = signal<FinancePeriod | null>(null)
  private readonly categoriesState = signal<FinanceCategory[]>([])
  private readonly movementsState = signal<FinanceMovement[]>([])
  private readonly recurringItemsState = signal<FinanceRecurringItem[]>([])
  private readonly allocationsState = signal<FinanceBudgetAllocation[]>([])
  private readonly goalsState = signal<FinanceGoal[]>([])
  private readonly goalContributionsState = signal<FinanceGoalContribution[]>([])
  private readonly loadingState = signal(true)
  private readonly savingState = signal(false)
  private readonly errorState = signal<string | null>(null)

  readonly settings = this.settingsState.asReadonly()
  readonly period = this.periodState.asReadonly()
  readonly categories = this.categoriesState.asReadonly()
  readonly movements = this.movementsState.asReadonly()
  readonly recurringItems = this.recurringItemsState.asReadonly()
  readonly allocations = this.allocationsState.asReadonly()
  readonly goals = this.goalsState.asReadonly()
  readonly loading = this.loadingState.asReadonly()
  readonly saving = this.savingState.asReadonly()
  readonly error = this.errorState.asReadonly()

  readonly currencyCode = computed(() => this.settingsState()?.currency_code ?? 'EUR')
  readonly periodLabel = computed(() => {
    const period = this.periodState()
    if (!period) return 'Periodo actual'
    const start = this.parseDate(period.starts_on)
    const end = this.parseDate(period.ends_on)
    const month = new Intl.DateTimeFormat('es-ES', {month: 'long', year: 'numeric'}).format(start)
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return this.capitalize(month)
    }
    const startLabel = new Intl.DateTimeFormat('es-ES', {day: 'numeric', month: 'short'}).format(start)
    const endLabel = new Intl.DateTimeFormat('es-ES', {day: 'numeric', month: 'short', year: 'numeric'}).format(end)
    return `${startLabel} – ${endLabel}`
  })

  readonly movementViews = computed<FinanceMovementView[]>(() => {
    const categories = new Map(this.categoriesState().map(category => [category.id, category]))
    return this.movementsState().map(movement => {
      const category = categories.get(movement.category_id)
      return {
        ...movement,
        categoryName: category?.name ?? 'Sin categoría',
        flowType: (category?.flow_type ?? 'expense') as FinanceFlowType,
      }
    })
  })

  readonly recurringViews = computed<FinanceRecurringView[]>(() => {
    const categories = new Map(this.categoriesState().map(category => [category.id, category]))
    return this.recurringItemsState().map(item => {
      const category = categories.get(item.category_id)
      return {
        ...item,
        categoryName: category?.name ?? 'Sin categoría',
        flowType: (category?.flow_type ?? 'expense') as FinanceFlowType,
        monthlyEquivalent: item.amount / item.interval_months,
      }
    })
  })

  readonly goalViews = computed<FinanceGoalView[]>(() => {
    const contributions = new Map<number, number>()
    this.goalContributionsState()
      .forEach(movement => contributions.set(
        movement.goal_id as number,
        (contributions.get(movement.goal_id as number) ?? 0) + movement.amount,
      ))

    return this.goalsState().map(goal => {
      const currentAmount = goal.initial_amount + (contributions.get(goal.id) ?? 0)
      return {...goal, currentAmount, progress: Math.min(100, currentAmount / goal.target_amount * 100)}
    })
  })

  readonly budgetRows = computed<FinanceBudgetRow[]>(() => {
    const allocations = new Map(this.allocationsState().map(item => [item.category_id, item]))
    return this.categoriesState().map(category => {
      const categoryMovements = this.movementsState().filter(movement => movement.category_id === category.id)
      const committedAmount = categoryMovements
        .filter(movement => movement.status === 'pending')
        .reduce((sum, movement) => sum + movement.amount, 0)
      const actualAmount = categoryMovements
        .filter(movement => movement.status === 'completed')
        .reduce((sum, movement) => sum + movement.amount, 0)
      const allocation = allocations.get(category.id)
      return {
        category,
        plannedAmount: allocation?.planned_amount ?? committedAmount + actualAmount,
        actualAmount,
        committedAmount,
        allocationId: allocation?.id ?? null,
      }
    })
  })

  readonly summary = computed<FinanceSummary>(() => {
    const period = this.periodState()
    const rows = this.budgetRows()
    const plannedFor = (flowType: FinanceFlowType) => rows
      .filter(row => row.category.flow_type === flowType)
      .reduce((sum, row) => sum + row.plannedAmount, 0)
    const plannedIncome = plannedFor('income')
    const plannedExpense = plannedFor('expense')
    const plannedSaving = plannedFor('saving')
    const spent = rows
      .filter(row => row.category.flow_type === 'expense')
      .reduce((sum, row) => sum + row.actualAmount, 0)
    const reserved = rows
      .filter(row => row.category.flow_type !== 'income')
      .reduce((sum, row) => sum + row.committedAmount, 0)
    const available = (period?.opening_balance ?? 0) + plannedIncome
    return {
      available,
      spent,
      reserved,
      projectedRemainder: available - plannedExpense - plannedSaving,
      plannedIncome,
      plannedExpense,
      plannedSaving,
    }
  })

  constructor(
    private readonly repository: FinanceRepository,
    private readonly toast: ToastService,
  ) {
    void this.openDate(new Date())
  }

  async reload(): Promise<void> {
    const period = this.periodState()
    if (period) await this.openDate(this.parseDate(period.starts_on))
  }

  async previousPeriod(): Promise<void> {
    const period = this.periodState()
    if (!period) return
    const date = this.parseDate(period.starts_on)
    date.setDate(date.getDate() - 1)
    await this.openDate(date)
  }

  async nextPeriod(): Promise<void> {
    const period = this.periodState()
    if (!period) return
    const date = this.parseDate(period.ends_on)
    date.setDate(date.getDate() + 1)
    await this.openDate(date)
  }

  async saveSettings(draft: FinanceSettingsDraft): Promise<void> {
    await this.runSaving('Configuración actualizada', async () => {
      this.settingsState.set(await this.repository.saveSettings(draft))
    })
  }

  async saveMovement(draft: FinanceMovementDraft): Promise<void> {
    const period = this.requirePeriod()
    await this.runSaving(draft.id ? 'Movimiento actualizado' : 'Movimiento creado', async () => {
      await this.repository.saveMovement(period.id, draft)
      await this.loadPeriodData(period.id)
    })
  }

  async deleteMovement(movementId: number): Promise<void> {
    const period = this.requirePeriod()
    await this.runSaving('Movimiento eliminado', async () => {
      await this.repository.deleteMovement(movementId)
      await this.loadPeriodData(period.id)
    })
  }

  async saveRecurringItem(draft: FinanceRecurringDraft): Promise<void> {
    const period = this.requirePeriod()
    await this.runSaving(draft.id ? 'Recurrente actualizado' : 'Recurrente creado', async () => {
      await this.repository.saveRecurringItem(draft)
      await this.repository.materializePeriod(period.id)
      await this.loadAll(period.id)
    })
  }

  async archiveRecurringItem(itemId: number): Promise<void> {
    const period = this.requirePeriod()
    await this.runSaving('Recurrente archivado', async () => {
      await this.repository.archiveRecurringItem(itemId)
      await this.loadAll(period.id)
    })
  }

  async saveGoal(draft: FinanceGoalDraft): Promise<void> {
    const period = this.requirePeriod()
    await this.runSaving(draft.id ? 'Objetivo actualizado' : 'Objetivo creado', async () => {
      await this.repository.saveGoal(draft)
      await this.loadAll(period.id)
    })
  }

  async archiveGoal(goalId: number): Promise<void> {
    const period = this.requirePeriod()
    await this.runSaving('Objetivo archivado', async () => {
      await this.repository.archiveGoal(goalId)
      await this.loadAll(period.id)
    })
  }

  async savePlan(openingBalance: number, values: ReadonlyMap<number, number>): Promise<void> {
    const period = this.requirePeriod()
    await this.runSaving('Plan mensual guardado', async () => {
      await Promise.all([
        this.repository.saveOpeningBalance(period.id, openingBalance),
        this.repository.saveAllocations(period.id, values),
      ])
      await this.loadPeriodData(period.id)
      this.periodState.update(current => current ? {...current, opening_balance: openingBalance} : current)
    })
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: this.currencyCode(),
      minimumFractionDigits: 2,
    }).format(value)
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {day: 'numeric', month: 'short'}).format(this.parseDate(value))
  }

  private async openDate(date: Date): Promise<void> {
    this.loadingState.set(true)
    this.errorState.set(null)
    try {
      const period = await this.repository.ensurePeriod(this.toDateString(date))
      this.periodState.set(period)
      await this.repository.materializePeriod(period.id)
      await this.loadAll(period.id)
    } catch {
      this.errorState.set('No se pudieron cargar tus finanzas.')
    } finally {
      this.loadingState.set(false)
    }
  }

  private async loadAll(periodId: number): Promise<void> {
    const [settings, categories, recurringItems, goals, goalContributions] = await Promise.all([
      this.repository.readSettings(),
      this.repository.readCategories(),
      this.repository.readRecurringItems(),
      this.repository.readGoals(),
      this.repository.readGoalContributions(),
    ])
    this.settingsState.set(settings)
    this.categoriesState.set(categories)
    this.recurringItemsState.set(recurringItems)
    this.goalsState.set(goals)
    this.goalContributionsState.set(goalContributions)
    await this.loadPeriodData(periodId)
  }

  private async loadPeriodData(periodId: number): Promise<void> {
    const [movements, allocations] = await Promise.all([
      this.repository.readMovements(periodId),
      this.repository.readAllocations(periodId),
    ])
    this.movementsState.set(movements)
    this.allocationsState.set(allocations)
  }

  private async runSaving(successMessage: string, action: () => Promise<void>): Promise<void> {
    this.savingState.set(true)
    try {
      await action()
      this.toast.success(successMessage)
    } catch (error) {
      this.toast.error('No se pudieron guardar los cambios', {
        description: error instanceof Error ? error.message : 'Puedes volver a intentarlo.',
      })
      throw error
    } finally {
      this.savingState.set(false)
    }
  }

  private requirePeriod(): FinancePeriod {
    const period = this.periodState()
    if (!period) throw new Error('No hay un periodo financiero activo.')
    return period
  }

  private toDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day, 12)
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
}
