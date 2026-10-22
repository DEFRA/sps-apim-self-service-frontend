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
  AccountService
} from '../../../../core/account/account.service';

import {
  UserSummary
} from '../../../../core/account/account.models';

@Component({
  selector: 'app-manage-users',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './manage-users.component.html'
})
export class ManageUsersComponent
  implements OnInit {

  private readonly accountService =
    inject(AccountService);

  private readonly cdr =
    inject(ChangeDetectorRef);

  users: UserSummary[] = [];

  loading = true;

  successMessage:
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

          this.loading = false;

          this.cdr.detectChanges();

        },

        error: error => {

          console.error(error);

          this.loading = false;

          this.cdr.detectChanges();

        }

      });

  }

  reissueActivation(
    user: UserSummary
  ): void {

    this.accountService
      .reissueActivation(
        user.id
      )
      .subscribe({

        next: () => {

          this.successMessage =
            `Activation email reissued for ${user.email}`;

          this.cdr.detectChanges();

        }

      });

  }

  unlockUser(
    user: UserSummary
  ): void {

    this.accountService
      .unlockUser(
        user.id
      )
      .subscribe({

        next: () => {

          this.successMessage =
            'Account unlocked';

          this.loadUsers();

        }

      });

  }

  disableUser(
    user: UserSummary
  ): void {

    this.accountService
      .disableUser(
        user.id
      )
      .subscribe({

        next: () => {

          this.successMessage =
            'Account disabled';

          this.loadUsers();

        }

      });

  }

  enableUser(
    user: UserSummary
  ): void {

    this.accountService
      .enableUser(
        user.id
      )
      .subscribe({

        next: () => {

          this.successMessage =
            'Account enabled';

          this.loadUsers();

        }

      });

  }
}