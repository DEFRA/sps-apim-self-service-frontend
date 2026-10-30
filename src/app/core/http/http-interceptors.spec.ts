import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { CsrfService } from '../auth/csrf.service';
import { authenticationResponseInterceptor } from './authentication-response.interceptor';
import { credentialsInterceptor } from './credentials.interceptor';

describe('HTTP interceptors', () => {
  it('adds credentials and attaches CSRF only to modifying requests', () => {
    TestBed.configureTestingModule({
      providers: [{
        provide: CsrfService,
        useValue: { getToken: () => 'csrf-token' }
      }]
    });

    const injector = TestBed.inject(EnvironmentInjector);
    const post = new HttpRequest('POST', '/api/users', {});
    let forwarded: HttpRequest<unknown> | undefined;
    const next = vi.fn((request: HttpRequest<unknown>) => {
      forwarded = request;
      return of(new HttpResponse());
    });

    runInInjectionContext(injector, () => credentialsInterceptor(post, next));

    expect(forwarded?.withCredentials).toBe(true);
    expect(forwarded?.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');

    const get = new HttpRequest('GET', '/api/users');
    runInInjectionContext(injector, () => credentialsInterceptor(get, next));

    expect(forwarded?.withCredentials).toBe(true);
    expect(forwarded?.headers.has('X-XSRF-TOKEN')).toBe(false);
  });

  it('does not add a CSRF header when there is no token', () => {
    TestBed.configureTestingModule({
      providers: [{
        provide: CsrfService,
        useValue: { getToken: () => null }
      }]
    });

    let forwarded: HttpRequest<unknown> | undefined;
    runInInjectionContext(
      TestBed.inject(EnvironmentInjector),
      () => credentialsInterceptor(
        new HttpRequest('DELETE', '/api/users/1'),
        request => {
          forwarded = request;
          return of(new HttpResponse());
        }
      )
    );

    expect(forwarded?.withCredentials).toBe(true);
    expect(forwarded?.headers.has('X-XSRF-TOKEN')).toBe(false);
  });

  it('clears an expired session, redirects signed-in users and rethrows 401 errors', () => {
    const clearSession = vi.fn();
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => true, clearSession } },
        { provide: Router, useValue: { navigate } }
      ]
    });

    const error = new HttpErrorResponse({ status: 401 });
    const result = runInInjectionContext(
      TestBed.inject(EnvironmentInjector),
      () => authenticationResponseInterceptor(
        new HttpRequest('GET', '/api/private'),
        () => throwError(() => error)
      )
    );
    let actualError: unknown;
    result.subscribe({ error: value => actualError = value });

    expect(clearSession).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(actualError).toBe(error);
  });

  it('clears an unauthenticated session after 401 without redirecting', () => {
    const clearSession = vi.fn();
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => false, clearSession } },
        { provide: Router, useValue: { navigate } }
      ]
    });

    runInInjectionContext(
      TestBed.inject(EnvironmentInjector),
      () => authenticationResponseInterceptor(
        new HttpRequest('GET', '/api/private'),
        () => throwError(() => new HttpErrorResponse({ status: 401 }))
      )
    ).subscribe({ error: () => undefined });

    expect(clearSession).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not clear or redirect for non-401 errors', () => {
    const clearSession = vi.fn();
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => true, clearSession } },
        { provide: Router, useValue: { navigate } }
      ]
    });

    runInInjectionContext(
      TestBed.inject(EnvironmentInjector),
      () => authenticationResponseInterceptor(
        new HttpRequest('GET', '/api/private'),
        () => throwError(() => new HttpErrorResponse({ status: 500 }))
      )
    ).subscribe({ error: () => undefined });

    expect(clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
