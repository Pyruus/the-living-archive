import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuditLogEntry } from '../../core/models/admin.model';

@Component({
  selector: 'app-admin-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <input
        type="text"
        [(ngModel)]="actionFilter"
        (keyup.enter)="loadLogs()"
        placeholder="Filtruj po akcji (np. BlockUser, DeletePhoto)..."
        class="flex-1 min-w-[200px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-on-surface font-body placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Filtruj po akcji" />

      <button
        (click)="loadLogs()"
        class="rounded-lg bg-primary px-6 py-2 text-on-primary font-headline font-bold hover:bg-primary/90 transition-colors min-h-[44px]">
        Filtruj
      </button>
    </div>

    @if (loading()) {
      <div class="text-center py-12 text-on-surface-variant font-body" role="status" aria-live="polite">
        Ładowanie logów...
      </div>
    } @else {
      <div class="mb-4 text-sm text-on-surface-variant font-body">
        Znaleziono: {{ totalCount() }} wpisów
      </div>

      <div class="overflow-x-auto rounded-xl border border-outline-variant">
        <table class="w-full text-left font-body" aria-label="Dziennik audytu">
          <thead class="bg-surface-container-low">
            <tr>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Data</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Admin</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Akcja</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">ID celu</th>
            </tr>
          </thead>
          <tbody>
            @for (log of logs(); track log.id) {
              <tr class="border-t border-outline-variant hover:bg-surface-container-lowest transition-colors">
                <td class="px-4 py-3 text-on-surface-variant text-sm whitespace-nowrap">
                  {{ log.timestamp | date:'dd.MM.yyyy HH:mm:ss' }}
                </td>
                <td class="px-4 py-3 text-on-surface text-sm">
                  <span class="font-medium">{{ log.admin.displayName }}</span>
                  <span class="text-on-surface-variant ml-1">({{ log.admin.email }})</span>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block rounded-full px-3 py-1 text-xs font-bold"
                    [class]="actionClass(log.action)"
                    [title]="log.action">
                    {{ actionLabel(log.action) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-on-surface-variant text-sm font-mono">
                  {{ log.targetId }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-4 py-8 text-center text-on-surface-variant">
                  Brak wpisów w dzienniku audytu.
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
export class AdminAuditLogComponent {
  private readonly api = inject(AdminApiService);

  logs = signal<AuditLogEntry[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);

  actionFilter = '';
  pageSize = 50;

  totalPages = () => Math.ceil(this.totalCount() / this.pageSize);

  constructor() {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.api
      .getAuditLogs({
        action: this.actionFilter || undefined,
        page: this.currentPage(),
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.logs.set(result.data);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadLogs();
  }

  actionClass(action: string): string {
    if (action.includes('Delete')) return 'bg-error-container text-on-error-container';
    if (action.includes('Block')) return 'bg-error-container text-on-error-container';
    if (action.includes('Restore')) return 'bg-tertiary-container text-on-tertiary-container';
    if (action.includes('Unblock')) return 'bg-tertiary-container text-on-tertiary-container';
    if (action.includes('Resolve')) return 'bg-tertiary-container text-on-tertiary-container';
    if (action.includes('Approved')) return 'bg-tertiary-container text-on-tertiary-container';
    if (action.includes('Rejected')) return 'bg-secondary-container text-on-secondary-container';
    if (action.includes('Create')) return 'bg-primary-container text-on-primary-container';
    if (action.includes('Edit')) return 'bg-secondary-container text-on-secondary-container';
    return 'bg-primary-container text-on-primary-container';
  }

  actionLabel(action: string): string {
    const labels: Record<string, string> = {
      'DeletePhoto': 'Usunięcie zdjęcia',
      'RestorePhoto': 'Przywrócenie zdjęcia',
      'EditMetadata': 'Edycja metadanych',
      'DeleteComment': 'Usunięcie komentarza',
      'RestoreComment': 'Przywrócenie komentarza',
      'ResolveReport': 'Rozwiązanie zgłoszenia',
      'BlockUser': 'Zablokowanie użytkownika',
      'UnblockUser': 'Odblokowanie użytkownika',
      'CreateLocation': 'Utworzenie lokalizacji',
      'EditLocation': 'Edycja lokalizacji',
      'DeleteLocation': 'Usunięcie lokalizacji',
    };
    if (action.startsWith('SetStatus:')) {
      const status = action.split(':')[1];
      return status === 'Approved' ? 'Publikacja zdjęcia' : status === 'Rejected' ? 'Odrzucenie zdjęcia' : 'Zmiana statusu';
    }
    return labels[action] ?? action;
  }
}
