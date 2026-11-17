import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/account/account.service';

@Component({
  selector: 'app-request-access',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './request-access.component.html',
  styleUrl: './request-access.component.scss'
})
export class RequestAccessComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  submitting = false;
  submitted = false;
  validationFailed = false;
  requestFailed = false;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    requestType: [
      'Manage an existing API' as
        | 'Onboard a new API'
        | 'Manage an existing API'
        | 'Manage onboarding requests as an ICC administrator',
      Validators.required
    ],
    reason: ['', [Validators.required, Validators.maxLength(3000)]]
  });

  submit(): void {
    this.form.controls.firstName.setValue(this.form.controls.firstName.value.trim());
    this.form.controls.lastName.setValue(this.form.controls.lastName.value.trim());
    this.form.controls.email.setValue(this.form.controls.email.value.trim());
    this.form.controls.reason.setValue(this.form.controls.reason.value.trim());

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.validationFailed = true;
      return;
    }

    this.validationFailed = false;
    this.requestFailed = false;
    this.submitting = true;

    this.accountService.submitAccessRequest(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.submitting = false;
        this.requestFailed = true;
        this.changeDetector.markForCheck();
      }
    });
  }
}
