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
  selector: 'app-activate',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './activate.component.html'
})
export class ActivateComponent {

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
      .activate({

        userId:
          this.userId,

        token:
          this.token,

        password:
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
                activated: 'true'
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
``