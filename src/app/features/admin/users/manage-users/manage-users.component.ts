import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  AccountService
} from '../../../../core/account/account.service';

import {
  UserSummary
} from '../../../../core/account/account.models';

@Component({
  selector: 'app-manage-users',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl:
    './manage-users.component.html',
  styleUrl:
    './manage-users.component.scss'
})
export class ManageUsersComponent
  implements OnInit {

  private readonly accountService =
    inject(AccountService);

  private readonly cdr =
    inject(ChangeDetectorRef);

  users: UserSummary[] = [];

  filteredUsers: UserSummary[] = [];

  searchText = '';

  statusFilter = 'All';

  appliedSearchText = '';

  appliedStatusFilter = 'All';

  loading = true;

  loadFailed = false;

  successMessage:
    string | null = null;

  errorMessage:
    string | null = null;

  ngOnInit(): void {

    this.loadUsers();

  }

  loadUsers(): void {

    this.loading = true;

    this.accountService
      .getUsers()
      .subscribe({

        next: users => {

          console.log(
            'Users loaded',
            users
          );

          this.users = [...users];
          this.applyFilters();

          this.loading = false;
          this.loadFailed = false;

          this.cdr.detectChanges();

        },

        error: error => {

          console.error(error);

          this.loading = false;
          this.loadFailed = true;

          this.cdr.detectChanges();

        }

      });

  }

  applyFilters(): void {
    this.appliedSearchText = this.searchText.trim().toLocaleLowerCase();
    this.appliedStatusFilter = this.statusFilter;
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch =
        !this.appliedSearchText ||
        user.displayName.toLocaleLowerCase().includes(this.appliedSearchText) ||
        user.email.toLocaleLowerCase().includes(this.appliedSearchText);
      const matchesStatus =
        this.appliedStatusFilter === 'All' ||
        user.status === this.appliedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  displayStatus(status: string): string {
    switch (status) {
      case 'Active':
        return 'Enabled';
      case 'PendingActivation':
        return 'Pending activation';
      default:
        return status;
    }
  }

}