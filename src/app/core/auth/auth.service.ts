import {
  computed,
  inject,
  Injectable,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  catchError,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap
} from 'rxjs';

import {
  CsrfService
} from './csrf.service';

import {
  ChangePasswordRequest,
  SessionResponse,
  SignInRequest
} from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http =
    inject(HttpClient);

  private readonly csrf =
    inject(CsrfService);

  private readonly state =
    signal<SessionResponse | null>(null);

  private initialisation:
    Observable<SessionResponse | null> | undefined;

  readonly session =
    this.state.asReadonly();

  readonly isAuthenticated =
    computed(() => this.state() !== null);

  readonly isAdministrator =
    computed(() =>
      this.state()
        ?.roles
        .some(role =>
          role === 'Administrator' ||
          role === 'ICC Administrator'
        )
        ?? false
    );

  // -------------------------------------------------------
  // Application startup
  // -------------------------------------------------------

  initialise():
    Observable<SessionResponse | null> {

    if (!this.initialisation) {
      this.initialisation = this.loadSession().pipe(

        catchError(() => {

          this.clearSession();

          return of(null);

        }),

        shareReplay({
          bufferSize: 1,
          refCount: false
        })
      );
    }

    return this.initialisation;

  }

  // -------------------------------------------------------
  // Sign in
  // -------------------------------------------------------

  signIn(
    request: SignInRequest
  ): Observable<SessionResponse> {

    return this.csrf
      .refresh()
      .pipe(

        switchMap(() =>
          this.http.post<void>(
            '/api/auth/sign-in',
            request
          )
        ),

        switchMap(() =>
          this.loadSession()
        )

      );
  }

  // -------------------------------------------------------
  // Current session
  // -------------------------------------------------------

  loadSession():
    Observable<SessionResponse> {

    return this.http
      .get<SessionResponse>(
        '/api/auth/session'
      )
      .pipe(

        tap(session => {
          this.state.set(session);
        })

      );
  }

  // -------------------------------------------------------
  // Sign out
  // -------------------------------------------------------

  signOut():
    Observable<void> {

    return this.csrf
      .refresh()
      .pipe(

        switchMap(() =>
          this.http.post<void>(
            '/api/auth/sign-out',
            null
          )
        ),

        tap(() => {
          this.clearSession();
        })

      );
  }

  // -------------------------------------------------------
  // Change password
  // -------------------------------------------------------

  changePassword(
    request: ChangePasswordRequest
  ): Observable<void> {

    return this.csrf
      .refresh()
      .pipe(

        switchMap(() =>
          this.http.post<void>(
            '/api/auth/change-password',
            request
          )
        )

      );
  }

  // -------------------------------------------------------
  // Clear local authentication state
  // -------------------------------------------------------

  clearSession(): void {

    this.state.set(null);

    this.csrf.clear();

  }
}
