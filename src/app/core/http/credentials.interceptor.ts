import {
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  CsrfService
} from '../auth/csrf.service';

const modifyingMethods =
  new Set([
    'POST',
    'PUT',
    'PATCH',
    'DELETE'
  ]);

export const credentialsInterceptor:
  HttpInterceptorFn =
  (request, next) => {
    const csrf =
      inject(CsrfService);
    let updatedRequest =
      request.clone({
        withCredentials: true
      });
    const token =
      csrf.getToken();
    if (
      token &&
      modifyingMethods.has(
        request.method.toUpperCase()
      )
    ) {
      updatedRequest =
        updatedRequest.clone({

          setHeaders: {
            'X-XSRF-TOKEN':
              token
          }
        });
    }
    return next(
      updatedRequest
    );
  };