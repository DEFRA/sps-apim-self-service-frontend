import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  AccountService
} from '../../../../core/account/account.service';

import {
  CreateUserResponse
} from '../../../../core/account/account.models';

@Component({
  selector: 'app-create-user',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './create-user.component.html'
})
export class CreateUserComponent {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly accountService =
    inject(AccountService);

  private readonly changeDetector =
    inject(ChangeDetectorRef);

  submitting = false;

  failed = false;

  created = false;

  validationFailed = false;

  createdUser: CreateUserResponse | null = null;

  startOver(): void {
    this.form.reset();
    this.createdUser = null;
    this.created = false;
    this.validationFailed = false;
  }

  retry(): void {
    this.failed = false;
  }

  displayUserStatus(status: string): string {
    switch (status) {
      case 'PendingActivation':
        return 'Pending activation';
      case 'Active':
        return 'Active';
      default:
        return status;
    }
  }

  readonly form =
    this.formBuilder.nonNullable.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      firstName: [
        '',
        Validators.required
      ],

      lastName: [
        '',
        Validators.required
      ],

      role: [
        'API Developer' as 'API Developer' | 'API Maintainer' | 'ICC Administrator' | 'Read only',
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

    this.form.controls.email.setValue(
      this.form.controls.email.value.trim()
    );
    this.form.controls.firstName.setValue(
      this.form.controls.firstName.value.trim()
    );
    this.form.controls.lastName.setValue(
      this.form.controls.lastName.value.trim()
    );
    this.form.controls.reason.setValue(
      this.form.controls.reason.value.trim()
    );
    this.form.controls.approvalReference.setValue(
      this.form.controls.approvalReference.value.trim()
    );

    if (this.form.invalid) {

      this.form.markAllAsTouched();
      this.validationFailed = true;

      return;
    }

    this.validationFailed = false;
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
          `${values.firstName} ${values.lastName}`,

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

          this.createdUser = response;

          this.created = true;

          this.changeDetector.markForCheck();
        },

        error: () => {

          this.submitting = false;

          this.failed = true;

          this.changeDetector.markForCheck();
        }

      });
  }
}
