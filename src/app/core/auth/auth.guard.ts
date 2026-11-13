import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.initialise().pipe(
    map(() =>
      auth.isAuthenticated()
        ? true
        : router.createUrlTree(['/login'])
    )
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.initialise().pipe(
    map(() =>
      auth.isAdministrator()
        ? true
        : router.createUrlTree(['/forbidden'])
    )
  );
};