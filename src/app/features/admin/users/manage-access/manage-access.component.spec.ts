import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../../../../core/account/account.service';
import { ManageAccessComponent } from './manage-access.component';

afterEach(() => vi.restoreAllMocks());

describe('ManageAccessComponent', () => {
  let fixture: ComponentFixture<ManageAccessComponent>;
  let component: ManageAccessComponent;
  let account: {
    getUserAccess: ReturnType<typeof vi.fn>;
    updateUserAccess: ReturnType<typeof vi.fn>;
    reissueActivation: ReturnType<typeof vi.fn>;
    unlockUser: ReturnType<typeof vi.fn>;
  };

  const access = {
    userId: 'user-id',
    displayName: 'Test User',
    email: 'test@example.com',
    status: 'Active',
    isLocked: false,
    role: 'API Developer',
    projectIds: ['project-1'],
    projects: [
      { id: 'project-1', name: 'Water', isActive: true },
      { id: 'project-2', name: 'Air', isActive: true }
    ],
    history: []
  };

  beforeEach(async () => {
    account = {
      getUserAccess: vi.fn(() => of(access)),
      updateUserAccess: vi.fn(() => of(undefined)),
      reissueActivation: vi.fn(() => of({})),
      unlockUser: vi.fn(() => of(undefined))
    };
    TestBed.configureTestingModule({
      imports: [ManageAccessComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'user-id' } } }
        },
        { provide: AccountService, useValue: account }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ManageAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the user, role, project choices and existing project assignment', () => {
    expect(component.loading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Manage access');
    expect(fixture.nativeElement.textContent).toContain('test@example.com');
    expect(fixture.nativeElement.textContent).toContain('Water');
    expect(fixture.nativeElement.textContent).toContain('Air');
    expect(component.isProjectSelected('project-1')).toBe(true);
    expect(component.isProjectSelected('project-2')).toBe(false);
  });

  it('requires a reason before submitting changes', () => {
    component.save();
    fixture.detectChanges();

    expect(account.updateUserAccess).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Enter a reason for changing this user’s access.'
    );
  });

  it('saves access with no project assignments when none are selected', () => {
    component.selectedRole = 'API Maintainer';
    component.selectedStatus = 'Disabled';
    component.selectedProjectIds = [];
    component.reason = 'Access reviewed';
    component.save();

    expect(account.updateUserAccess).toHaveBeenCalledWith('user-id', {
      role: 'API Maintainer',
      projectIds: [],
      status: 'Disabled',
      reason: 'Access reviewed'
    });
    expect(component.successMessage).toBe('User access has been updated.');
  });

  it('shows an error when saving access fails', () => {
    account.updateUserAccess.mockReturnValue(
      throwError(() => new Error('Unavailable'))
    );
    component.reason = 'Access reviewed';
    component.save();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('User access could not be updated. Try again.');
    expect(fixture.nativeElement.textContent).toContain(
      'User access could not be updated. Try again.'
    );
  });
});
