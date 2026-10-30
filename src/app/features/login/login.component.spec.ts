import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: { signIn: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    auth = { signIn: vi.fn() };
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                activated: 'true',
                passwordReset: 'true'
              })
            }
          }
        }
      ]
    });

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows success notices indicated by the query parameters', () => {
    expect(component.accountActivated).toBe(true);
    expect(component.passwordReset).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Your account has been activated');
    expect(fixture.nativeElement.textContent).toContain('Your password has been reset');
  });

  it('marks an invalid form as touched without attempting sign in', () => {
    component.submit();

    expect(component.form.controls.email.touched).toBe(true);
    expect(component.form.controls.password.touched).toBe(true);
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('navigates to the dashboard and clears the password after success', () => {
    auth.signIn.mockReturnValue(of({}));
    component.form.setValue({
      email: 'user@example.com',
      password: 'password'
    });

    component.submit();

    expect(auth.signIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password'
    });
    expect(component.submitting).toBe(false);
    expect(component.form.controls.password.value).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('shows a failure and clears the password when sign in fails', () => {
    auth.signIn.mockReturnValue(throwError(() => new Error('Rejected')));
    component.form.setValue({
      email: 'user@example.com',
      password: 'incorrect'
    });

    component.submit();
    fixture.detectChanges();

    expect(component.loginFailed).toBe(true);
    expect(component.submitting).toBe(false);
    expect(component.form.controls.password.value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('There is a problem');
  });
});
