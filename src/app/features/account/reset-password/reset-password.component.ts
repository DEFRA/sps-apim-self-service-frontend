import {
  Component,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  AccountService
} from '../../../core/account/account.service';

@Component({
  selector: 'app-reset-password',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './reset-password.component.html'
})
export class ResetPasswordComponent {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly accountService =
    inject(AccountService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  submitting = false;

  failed = false;

  readonly userId =
    this.route.snapshot
      .queryParamMap
      .get('userId') ?? '';

  readonly token =
    this.route.snapshot
      .queryParamMap
      .get('token') ?? '';

  readonly form =
    this.formBuilder.nonNullable.group({

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(12)
        ]
      ]

    });

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    if (!this.userId || !this.token) {

      this.failed = true;

      return;
    }

    this.submitting = true;
    this.failed = false;

    this.accountService
      .completePasswordReset({

        userId:
          this.userId,

        // ActivatedRoute normally exposes query
        // parameters decoded for the application.
        token:
          this.token,

        newPassword:
          this.form.controls.password.value

      })
      .subscribe({

        next: () => {

          this.submitting = false;

          this.form.controls
            .password
            .setValue('');

          void this.router.navigate(
            ['/login'],
            {
              queryParams: {
                passwordReset: 'true'
              }
            }
          );
        },

        error: () => {

          this.submitting = false;
          this.failed = true;

          this.form.controls
            .password
            .setValue('');
        }

      });
  }
}