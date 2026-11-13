import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { of } from 'rxjs';
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

  function runGuard(guard: typeof authGuard | typeof adminGuard) {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  }

  it('waits for session restoration before allowing or redirecting users', () => {
    const router = TestBed.inject(Router);
    let result: boolean | ReturnType<Router['parseUrl']> | undefined;

    initialise.mockImplementation(() => {
      authenticated.mockReturnValue(true);
      return of(null);
    });
    runGuard(authGuard).subscribe(value => result = value);
    expect(result).toBe(true);
    expect(initialise).toHaveBeenCalledOnce();

    authenticated.mockReturnValue(false);
    runGuard(authGuard).subscribe(value => result = value);
    expect(result).toEqual(router.parseUrl('/login'));
  });

  it('waits for session restoration before checking administrator access', () => {
    const router = TestBed.inject(Router);
    let result: boolean | ReturnType<Router['parseUrl']> | undefined;

    initialise.mockImplementation(() => {
      administrator.mockReturnValue(true);
      return of(null);
    });
    runGuard(adminGuard).subscribe(value => result = value);
    expect(result).toBe(true);

    administrator.mockReturnValue(false);
    runGuard(adminGuard).subscribe(value => result = value);
    expect(result).toEqual(router.parseUrl('/forbidden'));
  });
});
