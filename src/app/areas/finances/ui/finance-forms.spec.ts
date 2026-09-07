import {signal, Type} from '@angular/core'
import {TestBed} from '@angular/core/testing'
import {DIALOG_DATA, DialogRef} from '@shared/ui/dialog'
import {FinanceStore} from '../state/finance.store'
import {GoalFormComponent} from './goal-form/goal-form.component'
import {MovementFormComponent} from './movement-form/movement-form.component'
import {RecurringFormComponent} from './recurring-form/recurring-form.component'

describe('Finance creation forms', () => {
  const cases: ReadonlyArray<readonly [string, Type<unknown>]> = [
    ['movement', MovementFormComponent],
    ['recurring item', RecurringFormComponent],
    ['goal', GoalFormComponent],
  ]

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: DIALOG_DATA, useValue: undefined},
        {provide: DialogRef, useValue: {close: vi.fn()}},
        {
          provide: FinanceStore,
          useValue: {
            categories: signal([]),
            goals: signal([]),
            saving: signal(false),
          },
        },
      ],
    })
  })

  it.each(cases)('opens the new %s form without edit data', (_label, component) => {
    expect(() => TestBed.createComponent(component).detectChanges()).not.toThrow()
  })
})
