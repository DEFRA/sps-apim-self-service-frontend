import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../../../core/account/account.service';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { ActivatedRoute, provideRouter } from '@angular/router';

afterEach(() => vi.restoreAllMocks());

describe('ManageUsersComponent', () => {
  let fixture: ComponentFixture<ManageUsersComponent>;
  let component: ManageUsersComponent;
  let account: {
    getUsers: ReturnType<typeof vi.fn>;
  };

  const users = [
    {
      id: 'pending-user',
      displayName: 'Pending User',
      email: 'pending@example.com',
      status: 'PendingActivation',
      roles: ['API Developer'],
      projects: []
    },
    {
      id: 'locked-user',
      displayName: 'Locked User',
      email: 'locked@example.com',
      status: 'Locked',
      roles: ['API Developer'],
      projects: []
    },
    {
      id: 'active-user',
      displayName: 'Active User',
      email: 'active@example.com',
      status: 'Active',
      roles: ['ICC Administrator'],
      projects: ['Water']
    },
    {
      id: 'disabled-user',
      displayName: 'Disabled User',
      email: 'disabled@example.com',
      status: 'Disabled',
      roles: ['Read only'],
      projects: []
    }
  ];

  beforeEach(async () => {
    account = {
      getUsers: vi.fn(() => of(users))
    };
    TestBed.configureTestingModule({
      imports: [ManageUsersComponent],
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
    fixture = TestBed.createComponent(ManageUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads users and provides one Manage access action per account', () => {
    expect(component.loading).toBe(false);
    expect(component.users).toEqual(users);
    expect(fixture.nativeElement.textContent).toContain('pending@example.com');
    expect(fixture.nativeElement.textContent.match(/Manage access/g)).toHaveLength(4);
    expect(fixture.nativeElement.textContent).toContain('Water');
  });

  it('shows an error state when loading users fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    account.getUsers.mockReturnValue(throwError(() => new Error('Unavailable')));

    component.loadUsers();

    expect(component.loading).toBe(false);
    expect(component.loadFailed).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Users could not be loaded. Try again later.'
    );
  });

  it('filters users by name or email when filters are applied', () => {
    component.searchText = 'LOCKED@EXAMPLE.COM';
    component.applyFilters();
    fixture.detectChanges();

    expect(component.filteredUsers.map(user => user.id)).toEqual(['locked-user']);
    expect(fixture.nativeElement.textContent).toContain('1 user shown');
    expect(fixture.nativeElement.textContent).not.toContain('pending@example.com');
  });

  it('filters users by account status and shows readable statuses', () => {
    component.statusFilter = 'Active';
    component.applyFilters();
    fixture.detectChanges();

    expect(component.filteredUsers.map(user => user.id)).toEqual(['active-user']);
    expect(fixture.nativeElement.textContent).toContain('Enabled');
    expect(fixture.nativeElement.textContent).not.toContain('Pending User');
  });

  it('shows an empty state when no users match the filters', () => {
    component.searchText = 'no-such-user';
    component.applyFilters();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No users match your search and status filters.'
    );
  });

});
