import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute,Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private readonly route =
  inject(ActivatedRoute);

readonly accountActivated =
  this.route.snapshot
    .queryParamMap
    .get('activated') === 'true';

readonly passwordReset =
  this.route.snapshot
    .queryParamMap
    .get('passwordReset') === 'true';

  submitting = false;
  loginFailed = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.loginFailed = false;

    this.auth.signIn(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting = false;
        this.form.controls.password.setValue('');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.submitting = false;
        this.loginFailed = true;
        this.form.controls.password.setValue('');
      }
    });
  }
}
