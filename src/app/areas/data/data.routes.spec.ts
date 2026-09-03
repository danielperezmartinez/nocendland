import {DATA_ROUTES} from './data.routes'

describe('Data routes', () => {
  it('exposes the temporary area landing page', () => {
    expect(DATA_ROUTES).toHaveLength(1)
    expect(DATA_ROUTES[0].path).toBe('')
    expect(DATA_ROUTES[0].loadComponent).toBeDefined()
  })
})
