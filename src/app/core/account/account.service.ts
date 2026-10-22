import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  switchMap
} from 'rxjs';

import {
  CsrfService
} from '../auth/csrf.service';

import {
  UserSummary
} from './account.models';

import {
  ActivateAccountRequest,
  CompletePasswordResetRequest,
  CreateUserRequest,
  CreateUserResponse,
  ReissueActivationRequest,
  ReissueActivationResponse,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse
} from './account.models';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private readonly http =
    inject(HttpClient);

  private readonly csrf =
    inject(CsrfService);

  createUser(
    request: CreateUserRequest
  ) {
    return this.csrf.refresh().pipe(

      switchMap(() =>
        this.http.post<CreateUserResponse>(
          '/api/admin/users',
          request
        )
      )

    );
  }

  // reissueActivation(
  //   userId: string,
  //   request: ReissueActivationRequest
  // ) {
  //   return this.csrf.refresh().pipe(

  //     switchMap(() =>
  //       this.http.post<ReissueActivationResponse>(
  //         `/api/admin/users/${userId}/activation/reissue`,
  //         request
  //       )
  //     )

  //   );
  // }

  activate(
    request: ActivateAccountRequest
  ) {
    return this.csrf.refresh().pipe(

      switchMap(() =>
        this.http.post<void>(
          '/api/account/activate',
          request
        )
      )

    );
  }

  requestPasswordReset(
    request: RequestPasswordResetRequest
  ) {
    return this.csrf.refresh().pipe(

      switchMap(() =>
        this.http.post<RequestPasswordResetResponse>(
          '/api/account/password-reset/request',
          request
        )
      )

    );
  }

  getUsers() {

  return this.http.get<UserSummary[]>(
    '/api/admin/users'
  );

}

reissueActivation(
  userId: string
) {

  return this.http.post(
    `/api/admin/users/${userId}/activation/reissue`,
    {
      reason:
        'Activation link expired'
    }
  );

}

unlockUser(
  userId: string
) {

  return this.http.post(
    `/api/admin/users/${userId}/unlock`,
    {}
  );

}

disableUser(
  userId: string
) {

  return this.http.post(
    `/api/admin/users/${userId}/disable`,
    {
      reason:
        'Disabled by administrator'
    }
  );

}

enableUser(
  userId: string
) {

  return this.http.post(
    `/api/admin/users/${userId}/enable`,
    {
      reason:
        'Enabled by administrator'
    }
  );

}

  completePasswordReset(
    request: CompletePasswordResetRequest
  ) {
    return this.csrf.refresh().pipe(

      switchMap(() =>
        this.http.post<void>(
          '/api/account/password-reset/complete',
          request
        )
      )

    );
  }
}