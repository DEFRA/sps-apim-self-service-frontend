import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '../../../core/account/account.service';
import { AccessRequestsComponent } from './access-requests.component';

describe('AccessRequestsComponent', () => {
  let fixture: ComponentFixture<AccessRequestsComponent>;
  const accountService = {
    getAccessRequests: vi.fn(),
    getAccessRequest: vi.fn(),
    getProjects: vi.fn(),
    recordAccessRequestDecision: vi.fn(),
    sendAccessDecisionEmail: vi.fn()
  };
  const route = {
    snapshot: {
      paramMap: {
        get: vi.fn().mockReturnValue(null)
      }
    }
  };

  beforeEach(async () => {
    accountService.getAccessRequests.mockReturnValue(of([
      {
        id: 'request-1',
        firstName: 'Alex',
        lastName: 'Taylor',
        email: 'alex@example.gov.uk',
        requestType: 'Onboard a new API',
        reason: 'I need access to onboard an API.',
        submittedAtUtc: '2026-09-15T00:00:00Z',
        status: 'AwaitingReview'
      }
    ]));
    TestBed.configureTestingModule({
      imports: [AccessRequestsComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: accountService },
        { provide: ActivatedRoute, useValue: route }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(AccessRequestsComponent);
    fixture.detectChanges();
  });

  it('lists saved requests with their status and a review link', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Portal access requests');
    expect(text).toContain('Alex Taylor');
    expect(text).toContain('alex@example.gov.uk');
    expect(text).toContain('Awaiting review');
    expect(
      fixture.nativeElement.querySelector(
        'a[href="/admin/access-requests/request-1"]'
      )
    ).not.toBeNull();
  });

  it('loads access requests from the account service', () => {
    expect(accountService.getAccessRequests).toHaveBeenCalled();
  });

  it('records approval and then sends a decision email', () => {
    const component = fixture.componentInstance;
    const request = {
      id: 'request-1',
      firstName: 'Alex',
      lastName: 'Taylor',
      email: 'alex@example.gov.uk',
      requestType: 'Onboard a new API',
      reason: 'I need access to onboard an API.',
      submittedAtUtc: '2026-09-15T00:00:00Z',
      status: 'AwaitingReview'
    };
    component.request = request;
    component.selectedRole = 'API Maintainer';
    component.selectedProjectId = 'project-1';
    component.decisionNote = 'Approved by ICC.';
    accountService.recordAccessRequestDecision.mockReturnValue(of({
      ...request,
      status: 'Approved'
    }));
    accountService.sendAccessDecisionEmail.mockReturnValue(of(undefined));

    component.recordDecision();

    expect(accountService.recordAccessRequestDecision).toHaveBeenCalledWith(
      'request-1',
      {
        outcome: 'Approved',
        role: 'API Maintainer',
        projectId: 'project-1',
        decisionNote: 'Approved by ICC.'
      }
    );
    expect(accountService.sendAccessDecisionEmail).toHaveBeenCalledWith('request-1');
    expect(component.request?.status).toBe('Approved');
    expect(component.successMessage).toContain('email was sent');
  });
});
