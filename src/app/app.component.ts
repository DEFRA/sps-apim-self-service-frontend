import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs';

import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, AfterViewInit {

  readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  @ViewChild('adminMenu')
  adminMenu?: ElementRef<HTMLDetailsElement>;

  ngOnInit(): void {
    this.auth.initialise().subscribe();
  }

  ngAfterViewInit(): void {

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.closeAdminMenu();
      });
  }

  closeAdminMenu(): void {
    this.adminMenu?.nativeElement.removeAttribute('open');
  }

  onAdminMenuFocusOut(event: FocusEvent): void {

    const menu = this.adminMenu?.nativeElement;

    if (!menu) {
      return;
    }

    const nextFocusedElement =
      event.relatedTarget as HTMLElement | null;

    if (
      nextFocusedElement &&
      menu.contains(nextFocusedElement)
    ) {
      return;
    }

    this.closeAdminMenu();
  }

  signOut(): void {
    this.auth
      .signOut()
      .subscribe({
        next: () => this.router.navigate(['/login'])
      });
  }
}