import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SideNavMenuComponent } from './side-nav-menu.component';

describe('SideNavMenuComponent', () => {
  let component: SideNavMenuComponent;
  let fixture: ComponentFixture<SideNavMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideNavMenuComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideNavMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should present each area name as the section eyebrow', () => {
    const element = fixture.nativeElement as HTMLElement;
    const headings = Array.from(
      element.querySelectorAll<HTMLHeadingElement>('.atlas-navigation__eyebrow')
    ).map(heading => heading.textContent?.trim());

    expect(headings).toEqual(['Llimbro', 'Finanzas', 'Miscelánea', 'Datos']);
  });

  it('should link the legal pages from the home menu', () => {
    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('.atlas-navigation__legal a'))
      .map(link => link.getAttribute('href'));

    expect(links).toEqual(['/privacy', '/legal-notice']);
  });
});
