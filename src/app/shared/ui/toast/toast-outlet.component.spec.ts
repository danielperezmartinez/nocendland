import {ComponentFixture, TestBed} from '@angular/core/testing'
import {ToastOutletComponent} from './toast-outlet.component'
import {ToastService} from './toast.service'

describe('ToastOutletComponent', () => {
  let fixture: ComponentFixture<ToastOutletComponent>
  let service: ToastService

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [ToastOutletComponent]}).compileComponents()
    fixture = TestBed.createComponent(ToastOutletComponent)
    service = TestBed.inject(ToastService)
  })

  it('renders success and error messages with their semantic roles', () => {
    service.success('Guardado')
    service.error('No se pudo guardar')
    fixture.detectChanges()

    const status: HTMLElement | null = fixture.nativeElement.querySelector('[role="status"]')
    const alert: HTMLElement | null = fixture.nativeElement.querySelector('[role="alert"]')
    expect(status?.textContent).toContain('Guardado')
    expect(alert?.textContent).toContain('No se pudo guardar')
  })

  it('dismisses a message from its close button', () => {
    service.success('Guardado')
    fixture.detectChanges()

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    closeButton.click()
    fixture.detectChanges()

    expect(service.messages()).toEqual([])
    expect(fixture.nativeElement.querySelector('.toast')).toBeNull()
  })
})
