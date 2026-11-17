import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../../core/account/account.service';
import { ActivateComponent } from './activate/activate.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { RequestAccessComponent } from './request-access/request-access.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

function activatedRoute(params: Record<string, string>) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(params)
    }
  };
}

afterEach(() => vi.restoreAllMocks());

describe('ActivateComponent', () => {
  let fixture: ComponentFixture<ActivateComponent>;
  let component: ActivateComponent;
  let account: { activate: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    account = { activate: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ActivateComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: account },
        { provide: ActivatedRoute, useValue: activatedRoute({ userId: 'user-1', token: 'activation-token' }) }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ActivateComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('requires a password of at least 12 characters', () => {
    component.form.controls.password.setValue('short');
    component.submit();

    expect(component.form.controls.password.touched).toBe(true);
    expect(account.activate).not.toHaveBeenCalled();
  });

  it('activates the account and returns to sign in', () => {
    account.activate.mockReturnValue(of(undefined));
    component.form.controls.password.setValue('long-enough-password');

    component.submit();

    expect(account.activate).toHaveBeenCalledWith({
      userId: 'user-1',
      token: 'activation-token',
      password: 'long-enough-password'
    });
    expect(component.form.controls.password.value).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { activated: 'true' }
    });
    expect(component.failed).toBe(false);
    expect(component.submitting).toBe(false);
  });

  it('shows failure and clears the password when activation fails', () => {
    account.activate.mockReturnValue(throwError(() => new Error('Expired')));
    component.form.controls.password.setValue('long-enough-password');

    component.submit();

    expect(component.failed).toBe(true);
    expect(component.submitting).toBe(false);
    expect(component.form.controls.password.value).toBe('');
  });
});

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let account: { completePasswordReset: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    account = { completePasswordReset: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: account },
        { provide: ActivatedRoute, useValue: activatedRoute({ userId: 'user-2', token: 'reset-token' }) }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('submits the reset token and navigates after a successful reset', () => {
    account.completePasswordReset.mockReturnValue(of(undefined));
    component.form.controls.password.setValue('another-long-password');

    component.submit();

    expect(account.completePasswordReset).toHaveBeenCalledWith({
      userId: 'user-2',
      token: 'reset-token',
      newPassword: 'another-long-password'
    });
    expect(component.form.controls.password.value).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { passwordReset: 'true' }
    });
  });

  it('shows failure and clears the password when the reset request fails', () => {
    account.completePasswordReset.mockReturnValue(throwError(() => new Error('Expired')));
    component.form.controls.password.setValue('another-long-password');
    component.submit();

    expect(component.failed).toBe(true);
    expect(component.form.controls.password.value).toBe('');
    expect(component.submitting).toBe(false);
  });
});

describe('account password flows without link parameters', () => {
  it('does not activate an account when the activation link is incomplete', async () => {
    const activate = vi.fn();
    TestBed.configureTestingModule({
      imports: [ActivateComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: { activate } },
        { provide: ActivatedRoute, useValue: activatedRoute({}) }
      ]
    });
    await TestBed.compileComponents();
    const component = TestBed.createComponent(ActivateComponent).componentInstance;
    component.form.controls.password.setValue('long-enough-password');

    component.submit();

    expect(activate).not.toHaveBeenCalled();
    expect(component.failed).toBe(true);
  });

  it('does not reset a password when the reset link is incomplete', async () => {
    const completePasswordReset = vi.fn();
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: { completePasswordReset } },
        { provide: ActivatedRoute, useValue: activatedRoute({}) }
      ]
    });
    await TestBed.compileComponents();
    const component = TestBed.createComponent(ResetPasswordComponent).componentInstance;
    component.form.controls.password.setValue('another-long-password');

    component.submit();

    expect(completePasswordReset).not.toHaveBeenCalled();
    expect(component.failed).toBe(true);
  });
});

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let account: { requestPasswordReset: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    account = { requestPasswordReset: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: account }
      ]
    });

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('rejects invalid email addresses', () => {
    component.form.controls.email.setValue('invalid');
    component.submit();

    expect(component.form.controls.email.touched).toBe(true);
    expect(component.validationFailed).toBe(true);
    expect(account.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('requests a reset and navigates to the confirmation page', () => {
    account.requestPasswordReset.mockReturnValue(of({}));
    component.form.controls.email.setValue(' user@example.com ');

    component.submit();

    expect(account.requestPasswordReset).toHaveBeenCalledWith({ email: 'user@example.com' });
    expect(router.navigate).toHaveBeenCalledWith(['/forgot-password/confirmation']);
    expect(component.requestFailed).toBe(false);
  });

  it('shows a submission error and allows a successful retry', () => {
    account.requestPasswordReset
      .mockReturnValueOnce(throwError(() => new Error('Unavailable')))
      .mockReturnValueOnce(of({}));
    component.form.controls.email.setValue('user@example.com');

    component.submit();
    fixture.detectChanges();

    expect(component.submitting).toBe(false);
    expect(component.requestFailed).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'We could not submit your request. Try again.'
    );

    component.submit();

    expect(account.requestPasswordReset).toHaveBeenCalledTimes(2);
    expect(router.navigate).toHaveBeenCalledWith(['/forgot-password/confirmation']);
    expect(component.requestFailed).toBe(false);
  });
});

describe('RequestAccessComponent', () => {
  let fixture: ComponentFixture<RequestAccessComponent>;
  let component: RequestAccessComponent;
  let account: { submitAccessRequest: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    account = { submitAccessRequest: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RequestAccessComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: account }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(RequestAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows required-field validation and does not submit an incomplete request', () => {
    component.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      requestType: 'Manage an existing API',
      reason: ''
    });

    component.submit();
    fixture.detectChanges();

    expect(component.validationFailed).toBe(true);
    expect(account.submitAccessRequest).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Enter your first name');
    expect(fixture.nativeElement.textContent).toContain('Enter your email address');
    expect(fixture.nativeElement.textContent).toContain('Tell us why you need access');
  });

  it('submits trimmed request details and shows confirmation', () => {
    account.submitAccessRequest.mockReturnValue(of(undefined));
    component.form.setValue({
      firstName: ' Ada ',
      lastName: ' Lovelace ',
      email: ' ada@example.com ',
      requestType: 'Onboard a new API',
      reason: ' I need to onboard the service. '
    });

    component.submit();
    fixture.detectChanges();

    expect(account.submitAccessRequest).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      requestType: 'Onboard a new API',
      reason: 'I need to onboard the service.'
    });
    expect(component.submitted).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Access request submitted');
    expect(fixture.nativeElement.textContent).toContain('does not create an account');
  });

  it('shows a retryable error if the request cannot be sent', () => {
    account.submitAccessRequest.mockReturnValue(
      throwError(() => new Error('Notify unavailable'))
    );
    component.form.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      requestType: 'Manage an existing API',
      reason: 'I need to manage an API.'
    });

    component.submit();
    fixture.detectChanges();

    expect(component.requestFailed).toBe(true);
    expect(component.submitted).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(
      'We could not submit your request. Try again'
    );
  });
});
