import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  provideRouter,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { adminGuard, authGuard } from './auth.guard';

describe('authentication guards', () => {
  const authenticated = vi.fn(() => false);
  const administrator = vi.fn(() => false);
  const initialise = vi.fn(() => of(null));

  beforeEach(() => {
    authenticated.mockReset();
    administrator.mockReset();
    initialise.mockReset();

    authenticated.mockReturnValue(false);
    administrator.mockReturnValue(false);
    initialise.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            initialise,
            isAuthenticated: authenticated,
            isAdministrator: administrator
          }
        }
      ]
    });
  });

  function runGuard(
    guard: typeof authGuard | typeof adminGuard
  ): Observable<GuardResult> {
    return TestBed.runInInjectionContext(() =>
      guard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    ) as Observable<GuardResult>;
  }

  it('allows authenticated users', () => {
    let result: GuardResult | undefined;

    authenticated.mockReturnValue(true);

    runGuard(authGuard).subscribe((value: GuardResult) => {
      result = value;
    });

    expect(initialise).toHaveBeenCalledOnce();
    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to login', () => {
    const router = TestBed.inject(Router);
    let result: GuardResult | undefined;

    authenticated.mockReturnValue(false);

    runGuard(authGuard).subscribe((value: GuardResult) => {
      result = value;
    });

    expect(initialise).toHaveBeenCalledOnce();
    expect(result).toEqual(router.parseUrl('/login'));
  });

  it('allows administrators', () => {
    let result: GuardResult | undefined;

    administrator.mockReturnValue(true);

    runGuard(adminGuard).subscribe((value: GuardResult) => {
      result = value;
    });

    expect(initialise).toHaveBeenCalledOnce();
    expect(result).toBe(true);
  });

  it('redirects non-administrators to forbidden', () => {
    const router = TestBed.inject(Router);
    let result: GuardResult | undefined;

    administrator.mockReturnValue(false);

    runGuard(adminGuard).subscribe((value: GuardResult) => {
      result = value;
    });

    expect(initialise).toHaveBeenCalledOnce();
    expect(result).toEqual(router.parseUrl('/forbidden'));
  });
});