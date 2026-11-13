import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { LandingComponent } from './landing.component';
import { AuthService } from '../../core/auth/auth.service';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let currentSession: { displayName: string } | null;
  let administrator: boolean;

  beforeEach(async () => {
    currentSession = null;
    administrator = false;
    TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            session: () => currentSession,
            isAdministrator: () => administrator
          }
        }
      ]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  });

  it('shows the API Management portal introduction and onboarding choices', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('API Management');
    expect(text).toContain('API Management Self-Service Portal');
    expect(text).toContain('Choose what you need to do');
    expect(text).toContain('Onboard an API');
    expect(text).toContain('Manage onboarding requests');
    expect(text).toContain('Start API onboarding');
    expect(text).toContain('Sign in to the ICC admin area');
    expect(
      fixture.nativeElement.querySelector('section[aria-labelledby="onboard-heading"]')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('section[aria-labelledby="manage-heading"]')
    ).not.toBeNull();
  });

  it('explains how to request access and limits ICC admin access', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Request access to the portal');
    expect(text).toContain('first name');
    expect(text).toContain('last name');
    expect(text).toContain('email address');
    expect(text).toContain('why you need access to the portal');
    expect(text).toContain('authorised ICC team members');
    expect(
      fixture.nativeElement.querySelector(
        'a[href^="mailto:globalengcapabilityservice@defra.gov.uk?subject="]'
      ).textContent
    ).toContain('Request access by email');
    expect(
      fixture.nativeElement.querySelector(
        'a[href="mailto:globalengcapabilityservice@defra.gov.uk"]'
      )
    ).not.toBeNull();
  });

  it('provides both sign-in actions without requiring authentication to render', () => {
    const signInLinks: NodeListOf<HTMLAnchorElement> =
      fixture.nativeElement.querySelectorAll('a[href="/login"]');

    expect(signInLinks).toHaveLength(2);
    expect(
      fixture.nativeElement.querySelector(
        'a[href="/dashboard"]'
      )
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        'a[href="/admin"]'
      )
    ).toBeNull();
  });

  it('sends signed-in users to the dashboard to start API onboarding', () => {
    currentSession = { displayName: 'Portal User' };
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        'a[href="/dashboard"]'
      ).textContent
    ).toContain('Start API onboarding');
    expect(
      fixture.nativeElement.querySelector(
        'a[href="/login"]'
      )
    ).toBeNull();
    expect(
      fixture.nativeElement.textContent
    ).toContain('ICC admin access is available to administrators only.');
  });

  it('shows administrators a Manage link to the admin page', () => {
    currentSession = { displayName: 'Portal Admin' };
    administrator = true;
    fixture.detectChanges();

    const manageLink: HTMLAnchorElement =
      fixture.nativeElement.querySelector('a[href="/admin"]');

    expect(manageLink.textContent).toContain('Manage');
    expect(
      fixture.nativeElement.querySelector(
        'a[href="/login"]'
      )
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        'a[href="/dashboard"]'
      ).textContent
    ).toContain('Start API onboarding');
  });
});
