import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { adminGuard, authGuard } from './auth.guard';

describe('authentication guards', () => {
  const authenticated = vi.fn(() => false);
  const administrator = vi.fn(() => false);

  beforeEach(() => {
    authenticated.mockReset();
    administrator.mockReset();
    authenticated.mockReturnValue(false);
    administrator.mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: authenticated,
            isAdministrator: administrator
          }
        }
      ]
    });
  });

  function runGuard(guard: typeof authGuard | typeof adminGuard) {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  }

  it('allows authenticated users and redirects signed-out users to login', () => {
    const router = TestBed.inject(Router);

    expect(runGuard(authGuard)).toEqual(router.parseUrl('/login'));

    authenticated.mockReturnValue(true);
    expect(runGuard(authGuard)).toBe(true);
  });

  it('redirects non-administrators and allows administrators', () => {
    const router = TestBed.inject(Router);

    expect(runGuard(adminGuard)).toEqual(router.parseUrl('/forbidden'));

    administrator.mockReturnValue(true);
    expect(runGuard(adminGuard)).toBe(true);
  });
});
