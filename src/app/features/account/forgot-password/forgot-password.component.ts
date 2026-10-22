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
    Router,
    RouterLink
} from '@angular/router';

import {
    AccountService
} from '../../../core/account/account.service';


@Component({
    selector: 'app-forgot-password',

    standalone: true,

    imports: [
        ReactiveFormsModule,
        RouterLink
    ],

    templateUrl:
        './forgot-password.component.html'
})
export class ForgotPasswordComponent {

  private readonly router =
    inject(Router);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly accountService =
    inject(AccountService);

  submitting = false;

  readonly form =
    this.formBuilder.nonNullable.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ]

    });

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    this.submitting = true;

    this.accountService
      .requestPasswordReset(
        this.form.getRawValue()
      )
      .subscribe({

        next: () => {

          void this.router.navigate(
            ['/forgot-password/confirmation']
          );

        },

        error: () => {

          this.submitting = false;

        }

      });
  }
}
