import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterOutlet
} from '@angular/router';

import {
  AuthService
} from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  readonly auth =
    inject(AuthService);

  private readonly router =
    inject(Router);

  ngOnInit(): void {
    this.auth.initialise().subscribe();
  }

  signOut(): void {

    this.auth
      .signOut()
      .subscribe({
        next: () =>
          this.router.navigate(['/login'])
      });

  }
}