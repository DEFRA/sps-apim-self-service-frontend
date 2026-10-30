import { HttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { appConfig } from './app.config';
import { CsrfService } from './core/auth/csrf.service';

describe('appConfig', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('registers the HTTP interceptors for credentials and CSRF protection', () => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting()
      ]
    });
    const http = TestBed.inject(HttpClient);
    const requests = TestBed.inject(HttpTestingController);

    TestBed.inject(CsrfService).refresh().subscribe();
    const csrfRequest = requests.expectOne('/api/auth/csrf');
    expect(csrfRequest.request.withCredentials).toBe(true);
    csrfRequest.flush({ token: 'csrf-token' });

    http.post('/api/admin/users', {}).subscribe();
    const createUserRequest = requests.expectOne('/api/admin/users');
    expect(createUserRequest.request.withCredentials).toBe(true);
    expect(createUserRequest.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    createUserRequest.flush({});

    requests.verify();
  });
});
