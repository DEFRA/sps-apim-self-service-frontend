import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  let service: CsrfService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CsrfService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores a token received from the API', () => {
    service.refresh().subscribe();

    const request = http.expectOne('/api/auth/csrf');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ token: 'csrf-token' });

    expect(service.getToken()).toBe('csrf-token');
  });

  it('replaces the previous token when refreshed', () => {
    service.refresh().subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'first-token' });
    service.refresh().subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'second-token' });

    expect(service.getToken()).toBe('second-token');
  });

  it('clears the token', () => {
    service.refresh().subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });

    service.clear();

    expect(service.getToken()).toBeNull();
  });
});
