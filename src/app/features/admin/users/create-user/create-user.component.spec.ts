import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../../../../core/account/account.service';
import { CreateUserComponent } from './create-user.component';
import { provideRouter, ActivatedRoute } from '@angular/router';

afterEach(() => vi.restoreAllMocks());

describe('CreateUserComponent', () => {
  let fixture: ComponentFixture<CreateUserComponent>;
  let component: CreateUserComponent;
  let account: { createUser: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    account = { createUser: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CreateUserComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {},
            params: of({}),
            queryParams: of({})
          }
        },
        {
          provide: AccountService,
          useValue: account
        }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(CreateUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the prototype roles with API Developer selected by default', () => {
    expect(fixture.nativeElement.textContent).toContain('Create portal user');
    expect(fixture.nativeElement.querySelector('#role-api-developer').checked).toBe(true);
    expect(fixture.nativeElement.querySelector('#role-icc-administrator').checked).toBe(false);
  });

  it('shows required-field errors and does not submit an invalid form', () => {
    component.submit();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.email.touched).toBe(true);
    expect(component.form.controls.firstName.touched).toBe(true);
    expect(component.form.controls.lastName.touched).toBe(true);
    expect(component.form.controls.reason.touched).toBe(true);
    expect(component.form.controls.approvalReference.touched).toBe(true);
    expect(component.validationFailed).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('There is a problem');
    expect(fixture.nativeElement.textContent).toContain('Enter an email address');
    expect(fixture.nativeElement.textContent).toContain('Enter a first name');
    expect(fixture.nativeElement.textContent).toContain('Enter a last name');
    expect(account.createUser).not.toHaveBeenCalled();
  });

  it('does not submit an invalid email address', () => {
    component.form.setValue({
      email: 'not-an-email',
      firstName: 'New',
      lastName: 'User',
      role: 'API Developer',
      reason: 'Approved access',
      approvalReference: 'REQ-42'
    });

    component.submit();

    expect(component.form.controls.email.invalid).toBe(true);
    expect(account.createUser).not.toHaveBeenCalled();
  });

  it('trims form fields before submitting and combines first and last names', () => {
    account.createUser.mockReturnValue(of({
      id: 'new-user',
      email: 'new@example.com',
      displayName: 'New User',
      status: 'PendingActivation'
    }));
    component.form.setValue({
      email: ' new@example.com ',
      firstName: ' New ',
      lastName: ' User ',
      role: 'API Developer',
      reason: ' Approved access ',
      approvalReference: ' REQ-42 '
    });

    component.submit();

    expect(account.createUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      displayName: 'New User',
      role: 'API Developer',
      projectIds: [],
      reason: 'Approved access',
      approvalReference: 'REQ-42'
    });
  });

  it('submits the entered details and shows success when the user is created', async () => {
    account.createUser.mockReturnValue(of({
      id: 'new-user',
      email: 'new@example.com',
      displayName: 'New User',
      status: 'PendingActivation'
    }));
    component.form.setValue({
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'ICC Administrator',
      reason: 'Approved access',
      approvalReference: 'REQ-42'
    });
    component.submit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(account.createUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      displayName: 'New User',
      role: 'ICC Administrator',
      projectIds: [],
      reason: 'Approved access',
      approvalReference: 'REQ-42'
    });
    expect(component.created).toBe(true);
    expect(component.failed).toBe(false);
    expect(component.submitting).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('User account created');
    expect(fixture.nativeElement.textContent).toContain('new@example.com');
    expect(fixture.nativeElement.textContent).toContain('New User');
    expect(fixture.nativeElement.textContent).toContain('new-user');
    expect(fixture.nativeElement.textContent).toContain('Pending activation');
    expect(fixture.nativeElement.textContent).toContain('What happens next');
    expect(fixture.nativeElement.textContent).toContain('manage users page');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Create another user');
  });

  it('shows an error and allows retry when user creation fails', async () => {
    account.createUser
      .mockReturnValueOnce(throwError(() => new Error('Rejected')))
      .mockReturnValueOnce(of({
        id: 'new-user',
        email: 'new@example.com',
        displayName: 'New User',
        status: 'PendingActivation'
      }));
    component.form.setValue({
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'API Developer',
      reason: 'Approved access',
      approvalReference: 'REQ-42'
    });
    component.submit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.failed).toBe(true);
    expect(component.created).toBe(false);
    expect(component.submitting).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Something went wrong');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Try again');

    component.retry();
    fixture.detectChanges();

    expect(component.failed).toBe(false);

    component.submit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(account.createUser).toHaveBeenCalledTimes(2);
    expect(component.failed).toBe(false);
    expect(component.created).toBe(true);
  });
});
