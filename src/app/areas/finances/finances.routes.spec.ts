import {FINANCES_ROUTES} from './finances.routes'

describe('Finances routes', () => {
  it('exposes the temporary area landing page', () => {
    expect(FINANCES_ROUTES).toHaveLength(1)
    expect(FINANCES_ROUTES[0].path).toBe('')
    expect(FINANCES_ROUTES[0].loadComponent).toBeDefined()
  })
})
