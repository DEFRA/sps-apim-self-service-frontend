import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';
import { ForgotPasswordConfirmationComponent } from './features/account/forgot-password/forgot-password-confirmation.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ForbiddenComponent } from './features/forbidden/forbidden.component';
import { routes } from './app.routes';

afterEach(() => vi.restoreAllMocks());

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let currentSession: { displayName: string } | null;
  let administrator: boolean;
  let auth: {
    initialise: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    session: ReturnType<typeof vi.fn>;
    isAdministrator: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    currentSession = null;
    administrator = false;
    auth = {
      initialise: vi.fn(() => of(null)),
      signOut: vi.fn(() => of(undefined)),
      session: vi.fn(() => currentSession),
      isAdministrator: vi.fn(() => administrator)
    };
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('initialises authentication on startup', () => {
    fixture.detectChanges();

    expect(auth.initialise).toHaveBeenCalledOnce();
  });

  it('shows the service navigation but hides menus when signed out', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.govuk-service-navigation')
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('a[href="/dashboard"]')
    ).toBeNull();

    expect(
      fixture.nativeElement.querySelector('a[href="/admin"]')
    ).toBeNull();

    expect(
      fixture.nativeElement.querySelector('a[href="/admin/users"]')
    ).toBeNull();

    expect(
      fixture.nativeElement.querySelector('a[href="/admin/users/create"]')
    ).toBeNull();
  });

  it('shows Home and Dashboard after sign-in but no Admin menu for a regular user', () => {
    currentSession = { displayName: 'Portal User' };
    fixture.detectChanges();

    const navigation = fixture.nativeElement.querySelector(
      '.govuk-service-navigation'
    ) as HTMLElement;

    expect(navigation.textContent).toContain('Home');
    expect(navigation.textContent).toContain('Dashboard');
    expect(navigation.textContent).not.toContain('Admin');
    expect(navigation.textContent).not.toContain('User Management');
  });

  it('shows User Management inside the Admin menu for administrators', () => {
    currentSession = { displayName: 'Portal Admin' };
    administrator = true;
    fixture.detectChanges();

    const adminMenu = fixture.nativeElement.querySelector(
      '.app-admin-menu details'
    ) as HTMLDetailsElement;

    expect(adminMenu).not.toBeNull();
    expect(adminMenu.querySelector('summary')?.textContent).toContain('Admin');
    expect(adminMenu.querySelector('a[href="/admin"]')?.textContent).toContain(
      'Administration'
    );
    expect(
      adminMenu.querySelector('a[href="/admin/users"]')?.textContent
    ).toContain('User Management');
    expect(
      adminMenu.querySelector('a[href="/admin/users/create"]')?.textContent
    ).toContain('Create user');
  });

  it('signs out and navigates to the login page', () => {
    fixture.detectChanges();
    fixture.componentInstance.signOut();

    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('DashboardComponent', () => {
  it('shows a signed-in user, projects and administrator links', async () => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            session: () => ({
              id: 'user-1',
              email: 'admin@example.com',
              displayName: 'Portal Admin',
              roles: ['Administrator'],
              projects: [{ id: 'project-1', name: 'Project One' }]
            }),
            isAdministrator: () => true
          }
        }
      ]
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Welcome, Portal Admin');
    expect(fixture.nativeElement.textContent).toContain('Project One');
    expect(fixture.nativeElement.textContent).toContain('Manage portal administration');
  });

  it('shows the empty-project message for users without projects', async () => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            session: () => ({
              id: 'user-1',
              email: 'user@example.com',
              displayName: 'Portal User',
              roles: ['User'],
              projects: []
            }),
            isAdministrator: () => false
          }
        }
      ]
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No projects are currently assigned');
    expect(fixture.nativeElement.textContent).not.toContain('Administration');
  });
});

describe('simple page components', () => {
  it('renders the forbidden message and dashboard link', async () => {
    TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
      providers: [provideRouter([])]
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(ForbiddenComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You do not have permission');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/dashboard');
  });

  it('renders the password reset confirmation and return link', async () => {
    TestBed.configureTestingModule({
      imports: [ForgotPasswordConfirmationComponent],
      providers: [provideRouter([])]
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(ForgotPasswordConfirmationComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Check your email');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/login');
  });
});

describe('routes', () => {
  it('includes all public, authenticated and administrative pages', () => {
    const paths = routes.map(route => route.path);

    expect(paths).toContain('');
    expect(paths).toContain('login');
    expect(paths).toContain('activate');
    expect(paths).toContain('forgot-password');
    expect(paths).toContain('forgot-password/confirmation');
    expect(paths).toContain('reset-password');
    expect(paths).toContain('dashboard');
    expect(paths).toContain('admin');
    expect(paths).toContain('admin/users');
    expect(paths).toContain('admin/users/create');
    expect(paths).toContain('forbidden');
    expect(paths.at(-1)).toBe('**');
  });

  it('keeps the landing page public instead of redirecting to login', () => {
    const landing = routes.find(route => route.path === '');

    expect(landing?.redirectTo).toBeUndefined();
    expect(landing?.canActivate).toBeUndefined();
    expect(landing?.pathMatch).toBe('full');
    expect(landing?.loadComponent).toBeDefined();
  });

  it('protects dashboard and administrator routes with the appropriate guards', () => {
    const dashboard = routes.find(route => route.path === 'dashboard');
    const administration = routes.find(route => route.path === 'admin');
    const userManagement = routes.find(route => route.path === 'admin/users');

    expect(dashboard?.canActivate).toHaveLength(1);
    expect(administration?.canActivate).toHaveLength(2);
    expect(userManagement?.canActivate).toHaveLength(2);
  });
});
