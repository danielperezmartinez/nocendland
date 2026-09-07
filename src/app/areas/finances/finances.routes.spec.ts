import {FINANCES_ROUTES} from './finances.routes'

describe('Finances routes', () => {
  it('exposes the five approved finance pages inside their feature layout', () => {
    expect(FINANCES_ROUTES).toHaveLength(1)
    expect(FINANCES_ROUTES[0].path).toBe('')
    expect(FINANCES_ROUTES[0].component).toBeDefined()
    expect(FINANCES_ROUTES[0].children?.map(route => route.path)).toEqual([
      '',
      'summary',
      'movements',
      'recurring',
      'plan',
      'goals',
    ])
  })
})
