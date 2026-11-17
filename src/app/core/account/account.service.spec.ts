import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AccountService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectCsrfPost(
    request: Observable<unknown>,
    url: string,
    body: unknown,
    response: string | number | boolean | object | null = null
  ): void {
    request.subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });

    const apiRequest = http.expectOne({ method: 'POST', url });
    expect(apiRequest.request.body).toEqual(body);
    apiRequest.flush(response);
  }

  it('creates users after refreshing CSRF', () => {
    const body = {
      email: 'new@example.com',
      displayName: 'New User',
      role: 'API Developer' as const,
      projectIds: [],
      reason: 'Project access',
      approvalReference: 'REQ-123'
    };

    expectCsrfPost(
      service.createUser(body),
      '/api/admin/users',
      body,
      { id: 'new-id', email: body.email, displayName: body.displayName, status: 'PendingActivation' }
    );
  });

  it('activates accounts after refreshing CSRF', () => {
    const body = {
      userId: 'user-1',
      token: 'activation-token',
      password: 'long-secure-password'
    };

    expectCsrfPost(service.activate(body), '/api/account/activate', body);
  });

  it('requests password resets after refreshing CSRF', () => {
    const body = { email: 'user@example.com' };

    expectCsrfPost(
      service.requestPasswordReset(body),
      '/api/account/password-reset/request',
      body,
      { expiresAtUtc: '2030-01-01T00:00:00Z' }
    );
  });

  it('submits access requests after refreshing CSRF', () => {
    const body = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      requestType: 'Onboard a new API' as const,
      reason: 'I need to onboard the service.'
    };

    expectCsrfPost(
      service.submitAccessRequest(body),
      '/api/account/access-request',
      body
    );
  });

  it('completes password resets after refreshing CSRF', () => {
    const body = {
      userId: 'user-1',
      token: 'reset-token',
      newPassword: 'new-long-password'
    };

    expectCsrfPost(
      service.completePasswordReset(body),
      '/api/account/password-reset/complete',
      body
    );
  });

  it('retrieves users', () => {
    let users: unknown;
    service.getUsers().subscribe(value => users = value);

    const request = http.expectOne('/api/admin/users');
    expect(request.request.method).toBe('GET');
    request.flush([]);

    expect(users).toEqual([]);
  });

  it('retrieves access requests and dashboard counts', () => {
    service.getAccessRequests().subscribe();
    const requests = http.expectOne('/api/admin/access-requests');
    expect(requests.request.method).toBe('GET');
    requests.flush([]);

    service.getAccessRequest('request-1').subscribe();
    const request = http.expectOne('/api/admin/access-requests/request-1');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'request-1' });

    service.getAdminDashboardSummary().subscribe();
    const summary = http.expectOne('/api/admin/dashboard-summary');
    expect(summary.request.method).toBe('GET');
    summary.flush({
      portalUserCount: 1,
      accessRequestsAwaitingReviewCount: 0,
      activeOnboardingRequestsCount: null
    });
  });

  it('records an access decision and sends its notification email with CSRF protection', () => {
    const decision = {
      outcome: 'Approved' as const,
      role: 'API Developer',
      projectId: 'project-1',
      decisionNote: 'Approved by ICC.'
    };
    service.recordAccessRequestDecision('request-1', decision).subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const decisionRequest = http.expectOne({
      method: 'POST',
      url: '/api/admin/access-requests/request-1/decision'
    });
    expect(decisionRequest.request.body).toEqual(decision);
    decisionRequest.flush({ id: 'request-1', status: 'Approved' });

    service.sendAccessDecisionEmail('request-1').subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const emailRequest = http.expectOne({
      method: 'POST',
      url: '/api/admin/access-requests/request-1/decision-email'
    });
    expect(emailRequest.request.body).toEqual({});
    emailRequest.flush(null);
  });

  it('reissues activation with its configured reason', () => {
    service.reissueActivation('user-1').subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const request = http.expectOne({
      method: 'POST',
      url: '/api/admin/users/user-1/activation/reissue'
    });

    expect(request.request.body).toEqual({ reason: 'Activation link expired' });
    request.flush({});
  });

  it('unlocks a user', () => {
    service.unlockUser('user-1').subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const request = http.expectOne({
      method: 'POST',
      url: '/api/admin/users/user-1/unlock'
    });

    expect(request.request.body).toEqual({});
    request.flush({});
  });

  it.each([
    ['disableUser', '/api/admin/users/user-1/disable', { reason: 'Disabled by administrator' }],
    ['enableUser', '/api/admin/users/user-1/enable', { reason: 'Enabled by administrator' }]
  ] as const)('%s sends its action reason', (method, url, body) => {
    service[method]('user-1').subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const request = http.expectOne({ method: 'POST', url });

    expect(request.request.body).toEqual(body);
    request.flush(null);
  });

  it('loads project choices and existing user access', () => {
    service.getProjects().subscribe();
    const projectsRequest = http.expectOne('/api/admin/users/projects');
    expect(projectsRequest.request.method).toBe('GET');
    projectsRequest.flush([]);

    service.getUserAccess('user-1').subscribe();
    const accessRequest = http.expectOne('/api/admin/users/user-1/access');
    expect(accessRequest.request.method).toBe('GET');
    accessRequest.flush({});
  });

  it('updates user access after refreshing CSRF', () => {
    const body = {
      role: 'Read only',
      projectIds: [],
      status: 'Disabled',
      reason: 'Access review'
    };

    service.updateUserAccess('user-1', body).subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const request = http.expectOne({
      method: 'PUT',
      url: '/api/admin/users/user-1/access'
    });

    expect(request.request.body).toEqual(body);
    request.flush(null);
  });
});
