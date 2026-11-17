import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccountService } from '../../../../core/account/account.service';
import { UserAccessDetails } from '../../../../core/account/account.models';

@Component({
  selector: 'app-manage-access',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manage-access.component.html',
  styleUrl: './manage-access.component.scss'
})
export class ManageAccessComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly roles = [
    'API Developer',
    'API Maintainer',
    'ICC Administrator',
    'Read only'
  ];

  access: UserAccessDetails | null = null;
  selectedRole = '';
  selectedStatus = '';
  selectedProjectIds: string[] = [];
  reason = '';
  loading = true;
  saving = false;
  loadError = false;
  reasonError = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  actionInProgress = false;

  get isPendingActivation(): boolean {
    return this.access?.status === 'PendingActivation';
  }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.loadError = true;
      this.loading = false;
      return;
    }

    this.loadAccess(userId);
  }

  isProjectSelected(projectId: string): boolean {
    return this.selectedProjectIds.includes(projectId);
  }

  setProjectSelected(projectId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedProjectIds = checked
      ? [...this.selectedProjectIds, projectId]
      : this.selectedProjectIds.filter(id => id !== projectId);
  }

  save(): void {
    if (!this.access || this.saving) {
      return;
    }

    this.reasonError = !this.reason.trim();
    if (this.reasonError) {
      this.errorMessage = 'Enter a reason for changing this user’s access.';
      return;
    }

    this.successMessage = null;
    this.errorMessage = null;
    this.saving = true;

    this.accountService.updateUserAccess(this.access.userId, {
      role: this.selectedRole,
      projectIds: this.selectedProjectIds,
      status: this.selectedStatus,
      reason: this.reason.trim()
    }).subscribe({
      next: () => {
        this.saving = false;
        this.reason = '';
        this.reasonError = false;
        this.successMessage = 'User access has been updated.';
        this.loadAccess(this.access!.userId, false);
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'User access could not be updated. Try again.';
        this.cdr.detectChanges();
      }
    });
  }

  reissueActivation(): void {
    if (!this.access || this.actionInProgress) {
      return;
    }

    this.actionInProgress = true;
    this.errorMessage = null;
    this.accountService.reissueActivation(this.access.userId).subscribe({
      next: () => {
        this.actionInProgress = false;
        this.successMessage = `Activation email reissued for ${this.access?.email}.`;
        this.loadAccess(this.access!.userId, false);
      },
      error: () => {
        this.actionInProgress = false;
        this.errorMessage = 'The activation email could not be reissued. Try again.';
        this.cdr.detectChanges();
      }
    });
  }

  unlockAccount(): void {
    if (!this.access || this.actionInProgress) {
      return;
    }

    this.actionInProgress = true;
    this.errorMessage = null;
    this.accountService.unlockUser(this.access.userId).subscribe({
      next: () => {
        this.actionInProgress = false;
        this.successMessage = 'The account has been unlocked.';
        this.loadAccess(this.access!.userId, false);
      },
      error: () => {
        this.actionInProgress = false;
        this.errorMessage = 'The account could not be unlocked. Try again.';
        this.cdr.detectChanges();
      }
    });
  }

  displayAction(action: string): string {
    switch (action) {
      case 'ACCOUNT_CREATED':
        return 'Account created';
      case 'USER_ACCESS_UPDATED':
        return 'Access updated';
      case 'ACCOUNT_ENABLED':
        return 'Account enabled';
      case 'ACCOUNT_DISABLED':
        return 'Account disabled';
      case 'ACCOUNT_UNLOCKED':
        return 'Account unlocked';
      case 'ACTIVATION_ISSUED':
        return 'Activation email issued';
      default:
        return action.replaceAll('_', ' ').toLocaleLowerCase();
    }
  }

  private loadAccess(userId: string, showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }

    this.accountService.getUserAccess(userId).subscribe({
      next: access => {
        this.access = access;
        this.selectedRole = access.role;
        this.selectedStatus = access.status;
        this.selectedProjectIds = [...access.projectIds];
        this.loading = false;
        this.loadError = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.cdr.detectChanges();
      }
    });
  }
}
