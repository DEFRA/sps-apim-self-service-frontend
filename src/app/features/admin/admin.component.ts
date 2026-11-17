import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account/account.service';
import { AdminDashboardSummary } from '../../core/account/account.models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly cdr = inject(ChangeDetectorRef);

  summary: AdminDashboardSummary | null = null;
  loading = true;
  loadFailed = false;

  ngOnInit(): void {
    this.accountService.getAdminDashboardSummary().subscribe({
      next: summary => {
        this.summary = summary;
        this.loading = false;
        this.loadFailed = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadFailed = true;
        this.cdr.detectChanges();
      }
    });
  }
}