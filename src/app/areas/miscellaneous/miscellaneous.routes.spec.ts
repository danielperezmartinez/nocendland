import {MISCELLANEOUS_ROUTES} from './miscellaneous.routes'

describe('Miscellaneous routes', () => {
  it('exposes the temporary area landing page', () => {
    expect(MISCELLANEOUS_ROUTES).toHaveLength(1)
    expect(MISCELLANEOUS_ROUTES[0].path).toBe('')
    expect(MISCELLANEOUS_ROUTES[0].loadComponent).toBeDefined()
  })
})
