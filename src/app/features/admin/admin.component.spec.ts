import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../../core/account/account.service';
import { AdminDashboardSummary } from '../../core/account/account.models';
import { AdminComponent } from './admin.component';

describe('AdminComponent', () => {
  let fixture: ComponentFixture<AdminComponent>;
  let summaryResponse: Subject<AdminDashboardSummary>;
  const accountService = {
    getAdminDashboardSummary: vi.fn()
  };

  beforeEach(async () => {
    summaryResponse = new Subject<AdminDashboardSummary>();
    accountService.getAdminDashboardSummary.mockReturnValue(summaryResponse);
    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: accountService }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(AdminComponent);
    fixture.detectChanges();
  });

  it('renders the ICC administration heading and introduction', () => {
    const heading: HTMLHeadingElement =
      fixture.nativeElement.querySelector('h1');

    expect(heading.textContent).toBe('ICC administration');
    expect(heading.id).toBe('admin-heading');
    expect(fixture.nativeElement.textContent).toContain(
      'Manage API onboarding requests, portal users and project access.'
    );
  });

  it('shows the administration task cards and responsibilities', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Onboarding requests');
    expect(text).toContain('Access requests');
    expect(text).toContain('Users and access');
    expect(text).toContain('Admin responsibilities');
    expect(text).toContain('maintain an auditable history of changes');
  });

  it('routes Users and access to the User Management page', () => {
    const usersLink: HTMLAnchorElement =
      fixture.nativeElement.querySelector('a[href="/admin/users"]');

    expect(usersLink).not.toBeNull();
    expect(usersLink.textContent).toContain('Users and access');
  });

  it('shows live user and access request counts without a fabricated onboarding count', () => {
    summaryResponse.next({
      portalUserCount: 8,
      accessRequestsAwaitingReviewCount: 3,
      activeOnboardingRequestsCount: null
    });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('3');
    expect(text).toContain('8');
    expect(text).not.toContain('Loading count');
    expect(text).toContain('Onboarding request tracking is not connected');
    expect(text).not.toContain('4 active requests');
  });

  it('routes to the access request review list', () => {
    const link: HTMLAnchorElement =
      fixture.nativeElement.querySelector('a[href="/admin/access-requests"]');

    expect(link).not.toBeNull();
    expect(link.textContent).toContain('View access requests');
  });
});
