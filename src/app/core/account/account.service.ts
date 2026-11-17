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
  AccessRequestRequest,
  ActivateAccountRequest,
  CompletePasswordResetRequest,
  CreateUserRequest,
  CreateUserResponse,
  ReissueActivationRequest,
  ReissueActivationResponse,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  UpdateUserAccessRequest,
  UserAccessDetails,
  ProjectOption,
  AccessRequestSummary,
  AccessRequestDecision,
  AdminDashboardSummary
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

  submitAccessRequest(request: AccessRequestRequest) {
    return this.csrf.refresh().pipe(
      switchMap(() =>
        this.http.post<void>(
          '/api/account/access-request',
          request
        )
      )
    );
  }

  getAccessRequests() {
    return this.http.get<AccessRequestSummary[]>(
      '/api/admin/access-requests'
    );
  }

  getAccessRequest(requestId: string) {
    return this.http.get<AccessRequestSummary>(
      `/api/admin/access-requests/${requestId}`
    );
  }

  recordAccessRequestDecision(requestId: string, decision: AccessRequestDecision) {
    return this.csrf.refresh().pipe(
      switchMap(() =>
        this.http.post<AccessRequestSummary>(
          `/api/admin/access-requests/${requestId}/decision`,
          decision
        )
      )
    );
  }

  sendAccessDecisionEmail(requestId: string) {
    return this.csrf.refresh().pipe(
      switchMap(() =>
        this.http.post<void>(
          `/api/admin/access-requests/${requestId}/decision-email`,
          {}
        )
      )
    );
  }

  getAdminDashboardSummary() {
    return this.http.get<AdminDashboardSummary>(
      '/api/admin/dashboard-summary'
    );
  }

  getUsers() {

  return this.http.get<UserSummary[]>(
    '/api/admin/users'
  );

}

getProjects() {
  return this.http.get<ProjectOption[]>(
    '/api/admin/users/projects'
  );
}

getUserAccess(userId: string) {
  return this.http.get<UserAccessDetails>(
    `/api/admin/users/${userId}/access`
  );
}

updateUserAccess(
  userId: string,
  request: UpdateUserAccessRequest
) {
  return this.csrf.refresh().pipe(
    switchMap(() =>
      this.http.put<void>(
        `/api/admin/users/${userId}/access`,
        request
      )
    )
  );
}

reissueActivation(
  userId: string
) {
  return this.csrf.refresh().pipe(
    switchMap(() =>
      this.http.post<ReissueActivationResponse>(
        `/api/admin/users/${userId}/activation/reissue`,
        { reason: 'Activation link expired' } satisfies ReissueActivationRequest
      )
    )
  );

}

unlockUser(
  userId: string
) {

  return this.csrf.refresh().pipe(
    switchMap(() =>
      this.http.post<void>(
        `/api/admin/users/${userId}/unlock`,
        {}
      )
    )
  );

}

disableUser(
  userId: string
) {

    return this.csrf.refresh().pipe(
      switchMap(() =>
        this.http.post(
          `/api/admin/users/${userId}/disable`,
          {
            reason:
              'Disabled by administrator'
          }
        )
      )
    );

}

enableUser(
  userId: string
) {

    return this.csrf.refresh().pipe(
      switchMap(() =>
        this.http.post(
          `/api/admin/users/${userId}/enable`,
          {
            reason:
              'Enabled by administrator'
          }
        )
      )
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