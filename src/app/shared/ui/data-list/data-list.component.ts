import {ChangeDetectionStrategy, Component, Signal, computed, input, linkedSignal, signal} from '@angular/core'
import {FormsModule} from '@angular/forms'
import {BadgeComponent, BadgeConfig} from '@shared/ui/badge'
import {DEFAULT_IMAGE_PATH} from '@shared/ui/image/image.constants'

export type DataListItemId = string | number

export interface DataListItem<TItem> {
  id: DataListItemId
  value: TItem
  title: string
  details?: readonly string[]
  badges?: readonly BadgeConfig[]
  imageUrl?: string | null
  searchText?: string
}

export interface DataListConfig<TItem> {
  label: string
  actions?: {
    /** Elementos confirmados, siempre expresados como una colección homogénea. */
    confirm?: (items: readonly TItem[]) => void
    /** Solicita al consumidor que vuelva a cargar sus datos. */
    reload?: () => void
  }
  multiple?: Signal<boolean>
  showSelectionConfirmation?: boolean
  confirmationIcon?: string
  loading?: Signal<boolean>
  /** Número máximo de badges visibles por elemento; null muestra todos. */
  maxVisibleBadges?: number | null
  /** Identidades que deben aparecer seleccionadas al abrir una selección múltiple. */
  initialSelectedIds?: Signal<readonly DataListItemId[]>
}

@Component({
  selector: 'app-data-list',
  imports: [FormsModule, BadgeComponent],
  templateUrl: './data-list.component.html',
  styleUrl: './data-list.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DataListComponent<TItem = unknown> {
  readonly config = input.required<DataListConfig<TItem>>()
  readonly items = input.required<readonly DataListItem<TItem>[]>()

  protected readonly defaultImagePath = DEFAULT_IMAGE_PATH
  protected readonly filter = signal('')
  protected readonly multiple = computed(() => this.config().multiple?.() ?? false)
  protected readonly filteredItems = computed(() => {
    const filter = this.normalizeText(this.filter().trim())
    if (!filter) return this.items()

    return this.items().filter(item => this.normalizeText(
      item.searchText ?? [
        item.title,
        ...(item.details ?? []),
        ...this.badgeSearchTerms(item.badges ?? []),
      ].join(' '),
    ).includes(filter))
  })
  protected readonly selectedItems = linkedSignal<
    {items: readonly DataListItem<TItem>[]; multiple: boolean; initialSelectedIds: readonly DataListItemId[]},
    readonly DataListItem<TItem>[]
  >({
    source: () => ({
      items: this.items(),
      multiple: this.multiple(),
      initialSelectedIds: this.config().initialSelectedIds?.() ?? [],
    }),
    computation: ({items, multiple, initialSelectedIds}, previous) => {
      if (!multiple) return []
      const selectedIds = new Set(previous?.value.length
        ? previous.value.map(item => item.id)
        : initialSelectedIds)
      return items.filter(item => selectedIds.has(item.id))
    },
  })

  protected activate(item: DataListItem<TItem>): void {
    if (this.multiple()) {
      this.toggleSelection(item)
      return
    }

    this.config().actions?.confirm?.([item.value])
  }

  protected clearFilter(): void {
    this.filter.set('')
  }

  protected confirmSelection(): void {
    this.config().actions?.confirm?.(this.selectedItems().map(item => item.value))
    this.selectedItems.set([])
  }

  protected isSelected(item: DataListItem<TItem>): boolean {
    return this.selectedItems().some(selectedItem => selectedItem.id === item.id)
  }

  protected visibleBadges(item: DataListItem<TItem>): readonly BadgeConfig[] {
    const badges = item.badges ?? []
    const configuredLimit = this.config().maxVisibleBadges
    if (configuredLimit === null) return badges
    const limit = Math.max(0, Math.trunc(configuredLimit ?? 4))
    return badges.slice(0, limit)
  }

  protected overflowBadge(item: DataListItem<TItem>): BadgeConfig | null {
    const badges = item.badges ?? []
    const configuredLimit = this.config().maxVisibleBadges
    if (configuredLimit === null) return null
    const limit = Math.max(0, Math.trunc(configuredLimit ?? 4))
    const hiddenCount = badges.length - limit
    return hiddenCount > 0
      ? {
          variant: 'count',
          value: hiddenCount,
          prefix: '+',
          ariaLabel: hiddenCount === 1 ? '1 badge más' : `${hiddenCount} badges más`,
        }
      : null
  }

  protected reload(): void {
    this.config().actions?.reload?.()
  }

  private toggleSelection(item: DataListItem<TItem>): void {
    this.selectedItems.update(selected => this.isSelected(item)
      ? selected.filter(selectedItem => selectedItem.id !== item.id)
      : [...selected, item],
    )
  }

  private badgeSearchTerms(badges: readonly BadgeConfig[]): string[] {
    return badges.map(badge => {
      if (badge.variant === 'label') return badge.label
      if (badge.variant === 'dot') return badge.ariaLabel
      return [badge.prefix, badge.value, badge.ariaLabel].filter(value => value !== undefined).join(' ')
    })
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
}
