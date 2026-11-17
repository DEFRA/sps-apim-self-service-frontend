import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/account/account.service';
import {
  AccessRequestDecision,
  AccessRequestSummary,
  ProjectOption
} from '../../../core/account/account.models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './access-requests.component.html',
  styleUrl: './access-requests.component.scss'
})
export class AccessRequestsComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly requestId = this.route.snapshot.paramMap.get('requestId');
  readonly roles = [
    'API Developer',
    'API Maintainer',
    'ICC Administrator',
    'Read only'
  ];
  requests: AccessRequestSummary[] = [];
  request: AccessRequestSummary | null = null;
  projects: ProjectOption[] = [];
  outcome: AccessRequestDecision['outcome'] = 'Approved';
  selectedRole = 'API Developer';
  selectedProjectId = '';
  decisionNote = '';
  loading = true;
  loadFailed = false;
  savingDecision = false;
  sendingDecisionEmail = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    if (this.requestId) {
      this.accountService.getAccessRequest(this.requestId).subscribe({
        next: request => {
          this.request = request;
          this.loading = false;
          if (request.status === 'AwaitingReview') {
            this.loadProjects();
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.loadFailed = true;
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.accountService.getAccessRequests().subscribe({
      next: requests => {
        this.requests = requests;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadFailed = true;
        this.cdr.detectChanges();
      }
    });
  }

  recordDecision(): void {
    if (!this.request || this.request.status !== 'AwaitingReview' || this.savingDecision) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    if (!this.decisionNote.trim()) {
      this.errorMessage = 'Enter a decision note.';
      return;
    }

    this.savingDecision = true;
    this.accountService.recordAccessRequestDecision(
      this.request.id,
      {
        outcome: this.outcome,
        role: this.outcome === 'Approved' ? this.selectedRole : null,
        projectId: this.outcome === 'Approved' && this.selectedProjectId
          ? this.selectedProjectId
          : null,
        decisionNote: this.decisionNote.trim()
      }
    ).subscribe({
      next: request => {
        this.request = request;
        this.savingDecision = false;
        this.cdr.detectChanges();
        this.sendDecisionEmail();
      },
      error: () => {
        this.savingDecision = false;
        this.errorMessage =
          'We could not record this decision. The request may already have been decided. Reload the page and check its status.';
        this.cdr.detectChanges();
      }
    });
  }

  sendDecisionEmail(): void {
    if (!this.request || this.sendingDecisionEmail || this.request.decisionEmailSentAtUtc) {
      return;
    }

    this.sendingDecisionEmail = true;
    this.errorMessage = null;
    this.accountService.sendAccessDecisionEmail(this.request.id).subscribe({
      next: () => {
        if (this.request) {
          this.request = {
            ...this.request,
            decisionEmailSentAtUtc: new Date().toISOString()
          };
        }
        this.sendingDecisionEmail = false;
        this.successMessage = 'The decision was recorded and an email was sent to the requester.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.sendingDecisionEmail = false;
        this.errorMessage =
          'The decision was recorded, but the email could not be sent. Check the GOV.UK Notify decision template configuration, then try sending the email again.';
        this.cdr.detectChanges();
      }
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'AwaitingReview':
        return 'Awaiting review';
      case 'Approved':
        return 'Approved';
      case 'Rejected':
        return 'Rejected';
      case 'MoreInformationRequested':
        return 'More information requested';
      default:
        return status;
    }
  }

  private loadProjects(): void {
    this.accountService.getProjects().subscribe({
      next: projects => {
        this.projects = projects.filter(project => project.isActive);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage =
          'Project choices could not be loaded. You can still approve the request without assigning a project.';
        this.cdr.detectChanges();
      }
    });
  }
}
