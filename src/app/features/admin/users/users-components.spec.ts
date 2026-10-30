import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../../../core/account/account.service';
import { CreateUserComponent } from './create-user/create-user.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';

afterEach(() => vi.restoreAllMocks());

describe('CreateUserComponent', () => {
  let fixture: ComponentFixture<CreateUserComponent>;
  let component: CreateUserComponent;
  let account: { createUser: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    account = { createUser: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CreateUserComponent],
      providers: [{ provide: AccountService, useValue: account }]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(CreateUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requires every account and approval field', () => {
    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.email.touched).toBe(true);
    expect(component.form.controls.displayName.touched).toBe(true);
    expect(component.form.controls.reason.touched).toBe(true);
    expect(component.form.controls.approvalReference.touched).toBe(true);
    expect(account.createUser).not.toHaveBeenCalled();
  });

  it('submits all entered details with an empty project list', () => {
    account.createUser.mockReturnValue(of({
      id: 'new-user',
      email: 'new@example.com',
      displayName: 'New User',
      status: 'PendingActivation'
    }));
    component.form.setValue({
      email: 'new@example.com',
      displayName: 'New User',
      role: 'Administrator',
      reason: 'Approved access',
      approvalReference: 'REQ-42'
    });

    component.submit();
    fixture.detectChanges();

    expect(account.createUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      displayName: 'New User',
      role: 'Administrator',
      projectIds: [],
      reason: 'Approved access',
      approvalReference: 'REQ-42'
    });
    expect(component.created).toBe(true);
    expect(component.failed).toBe(false);
    expect(component.submitting).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('The user account has been created');
  });

  it('displays an error when user creation fails', () => {
    account.createUser.mockReturnValue(throwError(() => new Error('Rejected')));
    component.form.setValue({
      email: 'new@example.com',
      displayName: 'New User',
      role: 'User',
      reason: 'Approved access',
      approvalReference: 'REQ-42'
    });

    component.submit();

    expect(component.failed).toBe(true);
    expect(component.created).toBe(false);
    expect(component.submitting).toBe(false);
  });
});

describe('ManageUsersComponent', () => {
  let fixture: ComponentFixture<ManageUsersComponent>;
  let component: ManageUsersComponent;
  let account: {
    getUsers: ReturnType<typeof vi.fn>;
    reissueActivation: ReturnType<typeof vi.fn>;
    unlockUser: ReturnType<typeof vi.fn>;
    disableUser: ReturnType<typeof vi.fn>;
    enableUser: ReturnType<typeof vi.fn>;
  };

  const users = [
    {
      id: 'pending-user',
      displayName: 'Pending User',
      email: 'pending@example.com',
      status: 'PendingActivation',
      roles: ['User']
    },
    {
      id: 'locked-user',
      displayName: 'Locked User',
      email: 'locked@example.com',
      status: 'Locked',
      roles: ['User']
    },
    {
      id: 'active-user',
      displayName: 'Active User',
      email: 'active@example.com',
      status: 'Active',
      roles: ['Administrator']
    },
    {
      id: 'disabled-user',
      displayName: 'Disabled User',
      email: 'disabled@example.com',
      status: 'Disabled',
      roles: ['User']
    }
  ];

  beforeEach(async () => {
    account = {
      getUsers: vi.fn(() => of(users)),
      reissueActivation: vi.fn(() => of({})),
      unlockUser: vi.fn(() => of({})),
      disableUser: vi.fn(() => of({})),
      enableUser: vi.fn(() => of({}))
    };
    TestBed.configureTestingModule({
      imports: [ManageUsersComponent],
      providers: [{ provide: AccountService, useValue: account }]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ManageUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads users and presents the action appropriate to each status', () => {
    expect(component.loading).toBe(false);
    expect(component.users).toEqual(users);
    expect(fixture.nativeElement.textContent).toContain('pending@example.com');
    expect(fixture.nativeElement.textContent).toContain('Reissue Activation');
    expect(fixture.nativeElement.textContent).toContain('Unlock');
    expect(fixture.nativeElement.textContent).toContain('Disable');
    expect(fixture.nativeElement.textContent).toContain('Enable');
  });

  it('shows an error state when loading users fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    account.getUsers.mockReturnValue(throwError(() => new Error('Unavailable')));

    component.loadUsers();

    expect(component.loading).toBe(false);
  });

  it('reissues activation and shows a user-specific success message', () => {
    component.reissueActivation(users[0]);

    expect(account.reissueActivation).toHaveBeenCalledWith('pending-user');
    expect(component.successMessage).toBe('Activation email reissued for pending@example.com');
  });

  it.each([
    ['unlockUser', users[1], 'locked-user', 'Account unlocked'],
    ['disableUser', users[2], 'active-user', 'Account disabled'],
    ['enableUser', users[3], 'disabled-user', 'Account enabled']
  ] as const)('%s updates the account and refreshes the user list', (action, user, id, message) => {
    component[action](user);

    expect(account[action]).toHaveBeenCalledWith(id);
    expect(component.successMessage).toBe(message);
    expect(account.getUsers).toHaveBeenCalledTimes(2);
  });
});
