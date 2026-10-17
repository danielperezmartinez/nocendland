import {signal} from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainpageComponent } from './mainpage.component';
import {AuthService} from '@platform/auth/auth.service';
import {createAuthServiceStub} from '@testing/auth-service.stub';
import {provideRouter} from '@angular/router';
import {AppUpdateService} from '@platform/browser/app-update.service'
import {SideNavService} from '@shell/state/side-nav.service'

describe('MainpageComponent', () => {
  let component: MainpageComponent;
  let fixture: ComponentFixture<MainpageComponent>;
  const checking = signal(false)
  const appUpdate = {
    checking: checking.asReadonly(),
    checkForUpdate: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(async () => {
    checking.set(false)
    appUpdate.checkForUpdate.mockClear()
    await TestBed.configureTestingModule({
      imports: [MainpageComponent],
      providers: [
        provideRouter([]),
        {provide: AuthService, useFactory: createAuthServiceStub},
        {provide: AppUpdateService, useValue: appUpdate},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('checks for updates from the version control and reflects its state', () => {
    const updateButton: HTMLButtonElement = fixture.nativeElement.querySelector('.ui-icon-button--subtle')

    updateButton.click()
    expect(appUpdate.checkForUpdate).toHaveBeenCalledOnce()

    checking.set(true)
    fixture.detectChanges()
    expect(updateButton.disabled).toBe(true)
    expect(fixture.nativeElement.querySelector('.app-shell__version').textContent).toContain('Comprobando…')
  })

  it('keeps the closed navigation out of the keyboard focus order', () => {
    const navigation: HTMLElement = fixture.nativeElement.querySelector('#primary-navigation')
    const scrim: HTMLElement = fixture.nativeElement.querySelector('.app-shell__scrim')
    expect(navigation.inert).toBe(true)
    expect(scrim.inert).toBe(true)

    TestBed.inject(SideNavService).open()
    fixture.detectChanges()
    expect(navigation.inert).toBe(false)
    expect(scrim.inert).toBe(false)
  })
});
