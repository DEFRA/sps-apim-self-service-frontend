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
  AccountService
} from '../../../../core/account/account.service';

@Component({
  selector: 'app-create-user',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './create-user.component.html'
})
export class CreateUserComponent {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly accountService =
    inject(AccountService);

  submitting = false;

  failed = false;

  created = false;

  readonly form =
    this.formBuilder.nonNullable.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      displayName: [
        '',
        Validators.required
      ],

      role: [
        'User' as 'User' | 'Administrator',
        Validators.required
      ],

      reason: [
        '',
        Validators.required
      ],

      approvalReference: [
        '',
        Validators.required
      ]

    });

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    this.submitting = true;

    this.failed = false;

    this.created = false;

    const values =
      this.form.getRawValue();

    this.accountService
      .createUser({

        email:
          values.email,

        displayName:
          values.displayName,

        role:
          values.role,

        projectIds: [],

        reason:
          values.reason,

        approvalReference:
          values.approvalReference

      })
      .subscribe({

        next: response => {

          this.submitting = false;

          this.created = true;
        },

        error: () => {

          this.submitting = false;

          this.failed = true;

        }

      });
  }
}
