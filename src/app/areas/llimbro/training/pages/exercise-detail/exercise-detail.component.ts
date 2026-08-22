import {ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, signal} from '@angular/core'
import {ActivatedRoute} from '@angular/router'
import {NavigationService} from '@shell/navigation/navigation.service'
import {AvatarComponent} from '@shared/ui/avatar'
import {BadgeComponent, BadgeConfig} from '@shared/ui/badge'
import {CssTokenService, ThemeService} from '@shared/ui/theme'
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexMarkers,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
} from 'ng-apexcharts'
import {exerciseRouteQueryParams, parseExerciseRouteDate, readExerciseRouteContext} from '../../exercise-route-context'
import {TrainingExerciseHistoryEntry, TrainingSet} from '../../models/training.models'
import {TrainingStore} from '../../state/training.store'
import {trainingTaxonomyLabels} from '../../training.constants'
import {
  availableExerciseMetrics,
  buildExerciseProgress,
  calculateExerciseSessionMetrics,
  ExerciseProgressMetric,
  ExerciseProgressPoint,
  ExerciseProgressRange,
  filterExerciseHistory,
} from './exercise-progress'

const METRIC_LABELS: Readonly<Record<ExerciseProgressMetric, string>> = {
  estimatedOneRepMax: '1RM estimado',
  volume: 'Volumen',
  maximumWeight: 'Peso máximo',
  repetitions: 'Repeticiones',
}

const METRIC_UNITS: Readonly<Record<ExerciseProgressMetric, string>> = {
  estimatedOneRepMax: 'kg',
  volume: 'kg',
  maximumWeight: 'kg',
  repetitions: 'reps',
}

@Component({
  selector: 'app-exercise-detail',
  imports: [AvatarComponent, BadgeComponent, ChartComponent],
  templateUrl: './exercise-detail.component.html',
  styleUrl: './exercise-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ExerciseDetailComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly navigation = inject(NavigationService)
  private readonly cssTokens = inject(CssTokenService)
  private readonly theme = inject(ThemeService)
  protected readonly store = inject(TrainingStore)
  protected readonly routeContext = readExerciseRouteContext(this.route.snapshot)
  protected readonly rangeOptions: ReadonlyArray<{id: ExerciseProgressRange; label: string}> = [
    {id: '4w', label: '4S'},
    {id: '12w', label: '12S'},
    {id: '6m', label: '6M'},
    {id: '1y', label: '1A'},
    {id: 'all', label: 'Todo'},
  ]
  protected readonly selectedRange = signal<ExerciseProgressRange>('12w')
  protected readonly filteredHistory = computed(() =>
    filterExerciseHistory(this.store.exerciseHistory(), this.selectedRange()))
  protected readonly availableMetrics = computed(() => availableExerciseMetrics(this.filteredHistory()))
  protected readonly selectedMetric = linkedSignal<ExerciseProgressMetric[], ExerciseProgressMetric>({
    source: () => this.availableMetrics(),
    computation: (metrics, previous) => previous && metrics.includes(previous.value)
      ? previous.value
      : metrics[0] ?? 'repetitions',
  })
  protected readonly progressPoints = computed(() =>
    buildExerciseProgress(this.filteredHistory(), this.selectedMetric()))
  protected readonly selectedPoint = linkedSignal<ExerciseProgressPoint[], ExerciseProgressPoint | null>({
    source: () => this.progressPoints(),
    computation: (points, previous) => {
      const previousId = previous?.value?.entry.id
      return points.find(point => point.entry.id === previousId) ?? points.at(-1) ?? null
    },
  })
  protected readonly taxonomyBadges = computed<readonly BadgeConfig[]>(() => {
    const exercise = this.store.exerciseDetail()
    return exercise ? trainingTaxonomyLabels([
      ...exercise.training_modalities,
      ...exercise.muscle_groups,
      ...exercise.movement_patterns,
    ]).map(label => ({variant: 'label', label})) : []
  })
  protected readonly latestEntry = computed(() => this.filteredHistory().at(-1) ?? null)
  protected readonly latestSetSummary = computed(() => {
    const entry = this.latestEntry()
    if (!entry) return 'Sin sesiones'
    const weighted = [...entry.training_set]
      .filter(set => set.weight_kg !== null && set.weight_kg > 0)
      .sort((left, right) => right.weight_kg! - left.weight_kg!)[0]
    if (weighted) return `${this.formatNumber(weighted.weight_kg!)} kg${weighted.repetitions ? ` × ${weighted.repetitions}` : ''}`
    const repetitions = calculateExerciseSessionMetrics(entry).repetitions
    return repetitions === null ? 'Sesión incompleta' : `${this.formatNumber(repetitions)} reps`
  })
  protected readonly bestEstimatedOneRepMax = computed(() => {
    const values = buildExerciseProgress(this.filteredHistory(), 'estimatedOneRepMax').map(point => point.value)
    return values.length ? Math.max(...values) : null
  })
  protected readonly chartSeries = computed<ApexAxisChartSeries>(() => [{
    name: METRIC_LABELS[this.selectedMetric()],
    data: this.progressPoints().map(point => ({
      x: new Date(`${point.entry.performed_on}T00:00:00`).getTime(),
      y: point.value,
    })),
  }])
  protected readonly chartColors = signal<string[]>([])
  protected readonly chartGrid = signal<ApexGrid>({show: true})
  protected readonly chartXAxis = signal<ApexXAxis>({type: 'datetime'})
  protected readonly chartYAxis = signal<ApexYAxis>({})
  protected readonly chartTooltip = computed<ApexTooltip>(() => ({
    theme: this.theme.isDark() ? 'dark' : 'light',
    x: {format: 'dd MMM yyyy'},
    y: {formatter: value => this.formatMetric(value)},
  }))
  protected readonly chart: ApexChart = {
    type: 'area',
    height: 310,
    background: 'transparent',
    fontFamily: 'var(--font-family-body)',
    toolbar: {show: false},
    zoom: {enabled: false},
    animations: {enabled: true, speed: 260},
    events: {
      dataPointSelection: (_event, _chart, options) => {
        const index = options?.dataPointIndex
        const point = typeof index === 'number' ? this.progressPoints()[index] : undefined
        if (point) this.selectedPoint.set(point)
      },
    },
  }
  protected readonly chartStroke: ApexStroke = {curve: 'smooth', width: 3}
  protected readonly chartFill: ApexFill = {type: 'gradient', gradient: {opacityFrom: 0.38, opacityTo: 0.04}}
  protected readonly chartMarkers: ApexMarkers = {size: 5, strokeWidth: 3, hover: {sizeOffset: 2}}
  protected readonly chartDataLabels: ApexDataLabels = {enabled: false}

  private readonly exerciseId = Number(this.route.snapshot.params['id'])

  constructor() {
    if (Number.isInteger(this.exerciseId) && this.exerciseId > 0) {
      void this.store.loadExerciseDetail(this.exerciseId)
    } else {
      void this.navigation.to('training', 'exercises')
    }
    effect(() => {
      this.theme.theme()
      this.syncChartTheme()
    })
  }

  protected selectRange(range: ExerciseProgressRange): void {
    this.selectedRange.set(range)
  }

  protected selectMetric(metric: ExerciseProgressMetric): void {
    this.selectedMetric.set(metric)
  }

  protected selectPoint(entryId: number): void {
    const point = this.progressPoints().find(item => item.entry.id === entryId)
    if (point) this.selectedPoint.set(point)
  }

  protected selectPointFromEvent(event: Event): void {
    this.selectPoint(Number((event.target as HTMLSelectElement).value))
  }

  protected edit(): void {
    void this.navigation.to('training', 'exercise-form', String(this.exerciseId), {
      queryParams: exerciseRouteQueryParams(this.routeContext),
    })
  }

  protected goBack(): void {
    if (this.routeContext.origin === 'tracking') {
      const date = parseExerciseRouteDate(this.routeContext.date)
      if (date) this.store.selectDate(date)
      void this.navigation.to('training', 'tracking', undefined, {
        queryParams: this.routeContext.date ? {date: this.routeContext.date} : undefined,
      })
      return
    }
    void this.navigation.to('training', 'exercises')
  }

  protected metricLabel(metric: ExerciseProgressMetric): string {
    return METRIC_LABELS[metric]
  }

  protected formatMetric(value: number): string {
    return `${this.formatNumber(value)} ${METRIC_UNITS[this.selectedMetric()]}`
  }

  protected formatKilograms(value: number): string {
    return `${this.formatNumber(value)} kg`
  }

  protected selectedRangeLabel(): string {
    return this.rangeOptions.find(range => range.id === this.selectedRange())?.label ?? 'Periodo'
  }

  protected formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'})
  }

  protected formatSet(set: TrainingSet): string {
    const repetitions = set.repetitions === null ? '— reps' : `${set.repetitions} reps`
    const weight = set.weight_kg === null ? 'sin peso' : `${this.formatNumber(set.weight_kg)} kg`
    return `${weight} × ${repetitions}`
  }

  protected chartSummary(): string {
    const points = this.progressPoints()
    if (!points.length) return 'No hay datos suficientes para representar esta métrica.'
    return `${METRIC_LABELS[this.selectedMetric()]}: ${points.length} sesiones entre ${this.formatDate(points[0].entry.performed_on)} y ${this.formatDate(points.at(-1)!.entry.performed_on)}.`
  }

  private syncChartTheme(): void {
    const text = this.cssTokens.get('--color-text-muted')
    const border = this.cssTokens.get('--color-border')
    this.chartColors.set([this.cssTokens.get('--area-accent')])
    this.chartGrid.set({borderColor: border, strokeDashArray: 3, padding: {left: 6, right: 12}})
    this.chartXAxis.set({
      type: 'datetime',
      labels: {style: {colors: text, fontFamily: 'var(--font-family-body)'}, datetimeUTC: false},
      axisBorder: {color: border},
      axisTicks: {color: border},
      tooltip: {enabled: false},
    })
    this.chartYAxis.set({
      decimalsInFloat: 1,
      labels: {style: {colors: [text], fontFamily: 'var(--font-family-body)'}, formatter: value => this.formatNumber(value)},
    })
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES', {maximumFractionDigits: 1}).format(value)
  }
}
