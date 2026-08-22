import {CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList} from '@angular/cdk/drag-drop'
import {Directive, inject, input, output} from '@angular/core'
import {takeUntilDestroyed} from '@angular/core/rxjs-interop'

export interface SortableMove {
  previousIndex: number
  currentIndex: number
}

@Directive({
  selector: '[uiSortableList]',
  hostDirectives: [CdkDropList],
  host: {'class': 'ui-sortable-list'},
})
export class SortableListDirective {
  private readonly dropList = inject(CdkDropList)
  readonly move = output<SortableMove>({alias: 'uiSortableMove'})

  constructor() {
    this.dropList.orientation = 'vertical'
    this.dropList.dropped.pipe(takeUntilDestroyed()).subscribe(event => this.emitDrop(event))
  }

  moveFromKeyboard(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex || currentIndex < 0) return
    this.move.emit({previousIndex, currentIndex})
  }

  private emitDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return
    this.move.emit({previousIndex: event.previousIndex, currentIndex: event.currentIndex})
  }
}

@Directive({
  selector: '[uiSortableItem]',
  hostDirectives: [CdkDrag],
  host: {'class': 'ui-sortable-item'},
})
export class SortableItemDirective {
  private readonly list = inject(SortableListDirective)
  readonly index = input.required<number>({alias: 'uiSortableItem'})
  readonly count = input.required<number>({alias: 'uiSortableCount'})

  moveTo(currentIndex: number): void {
    const boundedIndex = Math.min(Math.max(currentIndex, 0), this.count() - 1)
    this.list.moveFromKeyboard(this.index(), boundedIndex)
  }
}

@Directive({
  selector: '[uiSortableHandle]',
  hostDirectives: [CdkDragHandle],
  host: {
    'class': 'ui-sortable-handle',
    '[attr.aria-keyshortcuts]': "'ArrowUp ArrowDown Home End'",
    '(keydown)': 'onKeydown($event)',
  },
})
export class SortableHandleDirective {
  private readonly item = inject(SortableItemDirective)

  protected onKeydown(event: KeyboardEvent): void {
    const destination = this.destinationFor(event.key)
    if (destination === null) return
    event.preventDefault()
    this.item.moveTo(destination)
  }

  private destinationFor(key: string): number | null {
    if (key === 'ArrowUp') return this.item.index() - 1
    if (key === 'ArrowDown') return this.item.index() + 1
    if (key === 'Home') return 0
    if (key === 'End') return this.item.count() - 1
    return null
  }
}
