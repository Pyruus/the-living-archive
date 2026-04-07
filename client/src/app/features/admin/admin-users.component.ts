import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AdminUser } from '../../core/models/admin.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <input
        type="text"
        [(ngModel)]="queryFilter"
        (keyup.enter)="loadUsers()"
        placeholder="Szukaj po nazwie lub e-mailu..."
        class="flex-1 min-w-[200px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-on-surface font-body placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Szukaj użytkowników" />

      <select
        [(ngModel)]="blockedFilter"
        (ngModelChange)="loadUsers()"
        class="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Filtruj według statusu blokady">
        <option value="">Wszyscy</option>
        <option value="false">Aktywni</option>
        <option value="true">Zablokowani</option>
      </select>

      <button
        (click)="loadUsers()"
        class="rounded-lg bg-primary px-6 py-2 text-on-primary font-headline font-bold hover:bg-primary/90 transition-colors min-h-[44px]">
        Szukaj
      </button>
    </div>

    <!-- Results -->
    @if (loading()) {
      <div class="text-center py-12 text-on-surface-variant font-body" role="status" aria-live="polite">
        Ładowanie użytkowników...
      </div>
    } @else {
      <div class="mb-4 text-sm text-on-surface-variant font-body">
        Znaleziono: {{ totalCount() }} użytkowników
      </div>

      <div class="overflow-x-auto rounded-xl border border-outline-variant">
        <table class="w-full text-left font-body" aria-label="Lista użytkowników">
          <thead class="bg-surface-container-low">
            <tr>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Nazwa</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">E-mail</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Rola</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Zdjęcia</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Dołączył</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Status</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Akcja</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr class="border-t border-outline-variant hover:bg-surface-container-lowest transition-colors">
                <td class="px-4 py-3 text-on-surface font-medium">{{ user.displayName }}</td>
                <td class="px-4 py-3 text-on-surface-variant text-sm">{{ user.email }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block rounded-full px-3 py-1 text-xs font-bold"
                    [class]="roleClass(user.role)">
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-4 py-3 text-on-surface-variant text-sm">{{ user.photoCount }}</td>
                <td class="px-4 py-3 text-on-surface-variant text-sm">
                  {{ user.createdAt | date:'dd.MM.yyyy' }}
                </td>
                <td class="px-4 py-3">
                  @if (user.isBlocked) {
                    <span class="inline-block rounded-full bg-error-container text-on-error-container px-3 py-1 text-xs font-bold">
                      Zablokowany
                    </span>
                  } @else {
                    <span class="inline-block rounded-full bg-tertiary-container text-on-tertiary-container px-3 py-1 text-xs font-bold">
                      Aktywny
                    </span>
                  }
                </td>
                <td class="px-4 py-3">
                  @if (user.isBlocked) {
                    <button
                      (click)="unblockUser(user)"
                      class="rounded-lg bg-tertiary-container px-4 py-1.5 text-xs text-on-tertiary-container font-bold hover:bg-tertiary-container/80 transition-colors min-h-[44px]"
                      [attr.aria-label]="'Odblokuj ' + user.displayName">
                      Odblokuj
                    </button>
                  } @else {
                    <button
                      (click)="blockUser(user)"
                      class="rounded-lg bg-error px-4 py-1.5 text-xs text-on-error font-bold hover:bg-error/90 transition-colors min-h-[44px]"
                      [attr.aria-label]="'Zablokuj ' + user.displayName">
                      Zablokuj
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-on-surface-variant">
                  Brak użytkowników do wyświetlenia.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalCount() > pageSize) {
        <div class="flex justify-center gap-2 mt-6">
          <button
            (click)="goToPage(currentPage() - 1)"
            [disabled]="currentPage() <= 1"
            class="rounded-lg border border-outline-variant px-4 py-2 text-on-surface font-body hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
            Poprzednia
          </button>
          <span class="flex items-center px-4 text-on-surface-variant font-body text-sm">
            Strona {{ currentPage() }} z {{ totalPages() }}
          </span>
          <button
            (click)="goToPage(currentPage() + 1)"
            [disabled]="currentPage() >= totalPages()"
            class="rounded-lg border border-outline-variant px-4 py-2 text-on-surface font-body hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
            Następna
          </button>
        </div>
      }
    }
  `,
})
export class AdminUsersComponent {
  private readonly api = inject(AdminApiService);

  users = signal<AdminUser[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);

  queryFilter = '';
  blockedFilter = '';
  pageSize = 20;

  totalPages = () => Math.ceil(this.totalCount() / this.pageSize);

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.api
      .getUsers({
        query: this.queryFilter || undefined,
        isBlocked:
          this.blockedFilter === ''
            ? undefined
            : this.blockedFilter === 'true',
        page: this.currentPage(),
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.users.set(result.data);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  blockUser(user: AdminUser): void {
    if (!confirm(`Czy na pewno chcesz zablokować "${user.displayName}"?`))
      return;
    this.api.blockUser(user.id).subscribe(() => this.loadUsers());
  }

  unblockUser(user: AdminUser): void {
    this.api.unblockUser(user.id).subscribe(() => this.loadUsers());
  }

  roleClass(role: string): string {
    switch (role) {
      case 'Admin':
        return 'bg-primary-container text-on-primary-container';
      case 'Creator':
        return 'bg-secondary-container text-on-secondary-container';
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  }
}
