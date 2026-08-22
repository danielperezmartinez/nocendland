import {TRAINING_TABS} from './layout/training-layout.component'
import {TRAINING_ROUTES} from './training.routes'

describe('Training routes', () => {
  it('keeps the requested tab order', () => {
    expect(TRAINING_TABS.map(tab => tab.label)).toEqual(['Ejercicios', 'Horario', 'Seguimiento', 'Medidas'])
  })

  it('exposes every primary route under the training layout', () => {
    const children = TRAINING_ROUTES[0].children?.map(route => route.path)
    expect(children).toContain('exercises')
    expect(children).toContain('schedule')
    expect(children).toContain('tracking')
    expect(children).toContain('measurements')
    expect(children).toContain('exercises/:id')
  })
})
