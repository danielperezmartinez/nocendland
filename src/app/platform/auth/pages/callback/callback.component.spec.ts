import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallbackComponent } from './callback.component';
import {ActivatedRoute, convertToParamMap, Router} from '@angular/router';
import {AuthService} from '@platform/auth/auth.service';
import {createAuthServiceStub} from '@testing/auth-service.stub';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        {provide: Router, useValue: {navigateByUrl: vi.fn().mockResolvedValue(true)}},
        {provide: ActivatedRoute, useValue: {snapshot: {queryParamMap: convertToParamMap({})}}},
        {provide: AuthService, useFactory: createAuthServiceStub}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('CallbackComponent failure handling', () => {
  it('does not validate an old session when PKCE exchange fails', async () => {
    const auth = {...createAuthServiceStub(), exchangeCodeForSession: vi.fn().mockRejectedValue(new Error('Used code')),
      isAuthenticated: vi.fn().mockResolvedValue(true)}
    const router = {navigate: vi.fn().mockResolvedValue(true), navigateByUrl: vi.fn()}
    const component = new CallbackComponent(auth as unknown as AuthService, router as unknown as Router,
      {snapshot: {queryParamMap: convertToParamMap({code: 'used', returnUrl: '/finances'})}} as ActivatedRoute)
    await component.ngOnInit()
    expect(auth.isAuthenticated).not.toHaveBeenCalled()
    expect(router.navigate).toHaveBeenCalledWith(['/auth'], {
      queryParams: {returnUrl: '/finances', error: 'callback'}, replaceUrl: true,
    })
  })

  it('removes the authorization code from browser history on success', async () => {
    const auth = {...createAuthServiceStub(), isAuthenticated: vi.fn().mockResolvedValue(true)}
    const router = {navigateByUrl: vi.fn().mockResolvedValue(true)}
    const component = new CallbackComponent(auth as unknown as AuthService, router as unknown as Router,
      {snapshot: {queryParamMap: convertToParamMap({code: 'valid', returnUrl: '/finances'})}} as ActivatedRoute)
    await component.ngOnInit()
    expect(router.navigateByUrl).toHaveBeenCalledWith('/finances', {replaceUrl: true})
  })
})
