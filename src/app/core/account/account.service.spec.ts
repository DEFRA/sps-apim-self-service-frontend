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
      role: 'User' as const,
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

  it('reissues activation with its configured reason', () => {
    service.reissueActivation('user-1').subscribe();
    const request = http.expectOne({
      method: 'POST',
      url: '/api/admin/users/user-1/activation/reissue'
    });

    expect(request.request.body).toEqual({ reason: 'Activation link expired' });
    request.flush({});
  });

  it('unlocks a user', () => {
    service.unlockUser('user-1').subscribe();
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
    const request = http.expectOne({ method: 'POST', url });

    expect(request.request.body).toEqual(body);
    request.flush({});
  });
});
