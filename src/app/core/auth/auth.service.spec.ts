import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { SessionResponse } from './auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const session: SessionResponse = {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'Example User',
    roles: ['User'],
    projects: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and stores the current session', () => {
    let result: SessionResponse | undefined;

    service.loadSession().subscribe(value => result = value);
    http.expectOne('/api/auth/session').flush(session);

    expect(result).toEqual(session);
    expect(service.session()).toEqual(session);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdministrator()).toBe(false);
  });

  it('refreshes CSRF before signing in and loads the resulting session', () => {
    let result: SessionResponse | undefined;

    service.signIn({
      email: 'user@example.com',
      password: 'correct horse battery staple'
    }).subscribe(value => result = value);

    http.expectOne({
      method: 'GET',
      url: '/api/auth/csrf'
    }).flush({ token: 'csrf-token' });
    http.expectOne({
      method: 'POST',
      url: '/api/auth/sign-in'
    }).flush(null);
    http.expectOne({
      method: 'GET',
      url: '/api/auth/session'
    }).flush({ ...session, roles: ['Administrator'] });

    expect(result?.roles).toEqual(['Administrator']);
    expect(service.isAdministrator()).toBe(true);
  });

  it('clears the session after signing out', () => {
    service.loadSession().subscribe();
    http.expectOne('/api/auth/session').flush(session);

    service.signOut().subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    http.expectOne({
      method: 'POST',
      url: '/api/auth/sign-out'
    }).flush(null);

    expect(service.session()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isAdministrator()).toBe(false);
  });

  it('refreshes CSRF before changing the password', () => {
    const request = {
      currentPassword: 'old-password',
      newPassword: 'new-password'
    };

    service.changePassword(request).subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const changePasswordRequest = http.expectOne({
      method: 'POST',
      url: '/api/auth/change-password'
    });
    expect(changePasswordRequest.request.body).toEqual(request);
    changePasswordRequest.flush(null);
  });

  it('clears local state when startup session loading fails', () => {
    let result: SessionResponse | null | undefined;

    service.initialise().subscribe(value => result = value);
    http.expectOne('/api/auth/session').flush('Unauthorised', {
      status: 401,
      statusText: 'Unauthorised'
    });

    expect(result).toBeNull();
    expect(service.session()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
