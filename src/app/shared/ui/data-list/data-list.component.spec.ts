import {signal} from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataListComponent } from './data-list.component';

describe('DataListComponent', () => {
  let component: DataListComponent;
  let fixture: ComponentFixture<DataListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', {label: 'Elementos'});
    fixture.componentRef.setInput('items', [{id: 1, value: {id: 1}, title: 'Elemento'}]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the typed presentation item', () => {
    expect(fixture.nativeElement.textContent).toContain('Elemento');
  });

  it('renders configured badges and summarizes those over the default limit', () => {
    fixture.componentRef.setInput('items', [{
      id: 1,
      value: {id: 1},
      title: 'Elemento',
      badges: ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco'].map(label => ({
        variant: 'label' as const,
        label,
        status: 'success' as const,
      })),
    }])
    fixture.detectChanges()

    const badges = [...fixture.nativeElement.querySelectorAll('.badge')] as HTMLElement[]
    expect(badges.map(badge => badge.textContent?.trim())).toEqual(['Uno', 'Dos', 'Tres', 'Cuatro', '+1'])
    expect(badges[0].dataset['status']).toBe('success')
    expect(badges[4].getAttribute('aria-label')).toBe('1 badge más')
  })

  it('supports a custom badge limit and an explicit unlimited list', () => {
    const items = [{
      id: 1,
      value: {id: 1},
      title: 'Elemento',
      badges: ['Uno', 'Dos', 'Tres'].map(label => ({variant: 'label' as const, label})),
    }]
    fixture.componentRef.setInput('items', items)
    fixture.componentRef.setInput('config', {label: 'Elementos', maxVisibleBadges: 2})
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.badge').length).toBe(3)
    expect(fixture.nativeElement.textContent).toContain('+1')

    fixture.componentRef.setInput('config', {label: 'Elementos', maxVisibleBadges: null})
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.badge').length).toBe(3)
    expect(fixture.nativeElement.textContent).not.toContain('+1')
  })

  it('filters by badges hidden behind the overflow count', () => {
    fixture.componentRef.setInput('items', [{
      id: 1,
      value: {id: 1},
      title: 'Sentadilla',
      badges: ['Fuerza', 'Cuádriceps', 'Glúteos', 'Sentadilla', 'Equilibrio'].map(label => ({
        variant: 'label' as const,
        label,
      })),
    }])
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.data-list__search-input')
    input.value = 'Equilibrio'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelectorAll('.data-list__item').length).toBe(1)
  })

  it('preselects the configured identities in multiple mode', () => {
    fixture.componentRef.setInput('config', {
      label: 'Elementos',
      multiple: signal(true),
      initialSelectedIds: signal([2]),
    })
    fixture.componentRef.setInput('items', [
      {id: 1, value: {id: 1}, title: 'Primero'},
      {id: 2, value: {id: 2}, title: 'Planificado'},
    ])
    fixture.detectChanges()
    const selected: HTMLElement = fixture.nativeElement.querySelector('.data-list__item--selected')
    expect(selected.textContent).toContain('Planificado')
  })

  it('keeps the tools and confirmation visible while only the items overflow', () => {
    fixture.componentRef.setInput('config', {
      label: 'Elementos',
      multiple: signal(true),
      showSelectionConfirmation: true,
    })
    fixture.componentRef.setInput('items', Array.from({length: 30}, (_, index) => ({
      id: index,
      value: {id: index},
      title: `Elemento ${index + 1}`,
    })))
    fixture.nativeElement.style.height = '20rem'
    fixture.detectChanges()

    const root: HTMLElement = fixture.nativeElement.querySelector('.data-list')
    const tools: HTMLElement = fixture.nativeElement.querySelector('.data-list__tools')
    const content: HTMLElement = fixture.nativeElement.querySelector('.data-list__content')
    const footer: HTMLElement = fixture.nativeElement.querySelector('.data-list__footer')
    Object.defineProperties(content, {
      scrollHeight: {configurable: true, value: 600},
      clientHeight: {configurable: true, value: 200},
    })
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({top: 0, bottom: 320} as DOMRect)
    vi.spyOn(tools, 'getBoundingClientRect').mockReturnValue({top: 0} as DOMRect)
    vi.spyOn(footer, 'getBoundingClientRect').mockReturnValue({bottom: 320} as DOMRect)
    const rootRect = root.getBoundingClientRect()

    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
    expect(getComputedStyle(content).overflowY).toBe('auto')
    expect(tools.getBoundingClientRect().top).toBeGreaterThanOrEqual(rootRect.top)
    expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(rootRect.bottom)
  })

  it('filters items and renders the empty state', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.data-list__search-input')
    input.value = 'No existe'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelectorAll('.data-list__item').length).toBe(0)
    expect(fixture.nativeElement.textContent).toContain('No hay elementos')
  })

  it('requests a reload from the toolbar', () => {
    const reload = vi.fn()
    fixture.componentRef.setInput('config', {label: 'Elementos', actions: {reload}})
    fixture.detectChanges()

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Actualizar lista"]')
    button.click()

    expect(reload).toHaveBeenCalledOnce()
  })

  it('confirms the selected domain values', () => {
    const confirm = vi.fn()
    fixture.componentRef.setInput('config', {
      label: 'Elementos',
      actions: {confirm},
      multiple: signal(true),
      showSelectionConfirmation: true,
    })
    fixture.detectChanges()

    const item: HTMLButtonElement = fixture.nativeElement.querySelector('.data-list__item')
    const confirmation: HTMLButtonElement = fixture.nativeElement.querySelector('.data-list__footer button')
    expect(confirmation.disabled).toBe(true)

    item.click()
    fixture.detectChanges()
    expect(confirmation.disabled).toBe(false)
    confirmation.click()

    expect(confirm).toHaveBeenCalledExactlyOnceWith([{id: 1}])
  })
});
