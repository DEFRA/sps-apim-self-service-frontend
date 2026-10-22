import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  catchError,
  throwError
} from 'rxjs';

import {
  AuthService
} from '../auth/auth.service';

export const authenticationResponseInterceptor:
  HttpInterceptorFn =
  (request, next) => {

    const authService =
      inject(AuthService);

    const router =
      inject(Router);

    return next(request).pipe(

      catchError(
        (error: HttpErrorResponse) => {

          if (error.status === 401) {

            const hadAuthenticatedSession =
              authService.isAuthenticated();

            authService.clearSession();

            if (hadAuthenticatedSession) {

              void router.navigate(
                ['/login']
              );

            }

          }

          return throwError(
            () => error
          );

        }
      )

    );
  };
