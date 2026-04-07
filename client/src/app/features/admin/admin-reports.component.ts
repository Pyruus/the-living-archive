import { Component, inject, signal, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../core/services/admin-api.service';
import { Report } from '../../core/models/photo.model';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Filter -->
      <div class="flex gap-4 items-center">
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-bold transition-colors min-h-[44px]"
          [class]="showResolved() ? 'bg-surface-container text-on-surface-variant' : 'bg-error text-on-error'"
          (click)="showResolved.set(false); loadReports()">
          Nierozwiązane
          @if (unresolvedCount() > 0) {
            <span class="ml-1 bg-on-error text-error rounded-full px-2 py-0.5 text-xs font-black">{{ unresolvedCount() }}</span>
          }
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-bold transition-colors min-h-[44px]"
          [class]="showResolved() ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'"
          (click)="showResolved.set(true); loadReports()">
          Rozwiązane
        </button>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <span class="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        </div>
      } @else if (reports().length === 0) {
        <div class="text-center py-12 text-on-surface-variant">
          <span class="material-symbols-outlined text-5xl mb-2 opacity-30">check_circle</span>
          <p>Brak zgłoszeń{{ showResolved() ? ' rozwiązanych' : '' }}.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (report of reports(); track report.id) {
            <div
              class="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-l-4 transition-all"
              [class]="report.isResolved ? 'border-outline-variant' : 'border-error'">
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1 min-w-0">
                  <!-- Type badge -->
                  <div class="flex items-center gap-2 mb-2">
                    @if (report.photoId) {
                      <span class="inline-flex items-center gap-1 bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full text-xs font-bold">
                        <span class="material-symbols-outlined text-xs">photo</span>
                        Zdjęcie
                      </span>
                      <a
                        class="text-sm font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                        [href]="'/explore?photo=' + report.photoId"
                        target="_blank">
                        {{ report.photoTitle }}
                        <span class="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    }
                    @if (report.commentId) {
                      <span class="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-xs font-bold">
                        <span class="material-symbols-outlined text-xs">comment</span>
                        Komentarz
                      </span>
                      @if (report.photoId) {
                        <a
                          class="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
                          [href]="'/explore?photo=' + report.photoId"
                          target="_blank">
                          Zobacz zdjęcie
                          <span class="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                      }
                    }
                  </div>

                  <!-- Comment content if applicable -->
                  @if (report.commentContent) {
                    <p class="text-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3 mb-2 italic">
                      "{{ report.commentContent }}"
                    </p>
                  }

                  <!-- Reason -->
                  <p class="text-sm text-on-surface mb-2">
                    <span class="font-bold">Powód:</span> {{ report.reason }}
                  </p>

                  <!-- Meta -->
                  <div class="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">person</span>
                      {{ report.reporterName }}
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">schedule</span>
                      {{ report.createdAt | date : 'dd.MM.yyyy HH:mm' }}
                    </span>
                  </div>
                </div>

                <!-- Actions / Status -->
                <div class="flex gap-2 shrink-0 items-center">
                  @if (!report.isResolved) {
                    @if (report.commentId) {
                      <button
                        type="button"
                        class="rounded-lg bg-error px-3 py-1.5 text-xs text-on-error font-bold hover:bg-error/90 transition-colors min-h-[44px]"
                        (click)="deleteReportedComment(report)">
                        Usuń komentarz
                      </button>
                    }
                    @if (report.photoId) {
                      <button
                        type="button"
                        class="rounded-lg bg-error px-3 py-1.5 text-xs text-on-error font-bold hover:bg-error/90 transition-colors min-h-[44px]"
                        (click)="deleteReportedPhoto(report)">
                        Usuń zdjęcie
                      </button>
                    }
                    <button
                      type="button"
                      class="rounded-lg bg-tertiary-container px-3 py-1.5 text-xs text-on-tertiary-container font-bold hover:bg-tertiary-container/80 transition-colors min-h-[44px]"
                      (click)="resolveReport(report)">
                      Rozwiąż
                    </button>
                  } @else {
                    <!-- Resolution status badge -->
                    @switch (report.resolutionAction) {
                      @case ('Deleted') {
                        <span class="inline-flex items-center gap-1 bg-error-container text-on-error-container px-3 py-1.5 rounded-lg text-xs font-bold">
                          <span class="material-symbols-outlined text-xs">delete</span>
                          Usunięto
                        </span>
                        @if (report.commentId) {
                          <button
                            type="button"
                            class="rounded-lg bg-primary px-3 py-1.5 text-xs text-on-primary font-bold hover:bg-primary/90 transition-colors min-h-[44px]"
                            (click)="restoreComment(report)">
                            Przywróć komentarz
                          </button>
                        }
                        @if (report.photoId && !report.commentId) {
                          <button
                            type="button"
                            class="rounded-lg bg-primary px-3 py-1.5 text-xs text-on-primary font-bold hover:bg-primary/90 transition-colors min-h-[44px]"
                            (click)="restorePhoto(report)">
                            Przywróć zdjęcie
                          </button>
                        }
                      }
                      @case ('Restored') {
                        <span class="inline-flex items-center gap-1 bg-tertiary-container text-on-tertiary-container px-3 py-1.5 rounded-lg text-xs font-bold">
                          <span class="material-symbols-outlined text-xs">undo</span>
                          Przywrócono
                        </span>
                      }
                      @default {
                        <span class="inline-flex items-center gap-1 bg-tertiary-container text-on-tertiary-container px-3 py-1.5 rounded-lg text-xs font-bold">
                          <span class="material-symbols-outlined text-xs">check_circle</span>
                          Odrzucono zgłoszenie
                        </span>
                      }
                    }
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminReportsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  readonly countChanged = output<number>();

  readonly reports = signal<Report[]>([]);
  readonly loading = signal(false);
  readonly showResolved = signal(false);
  readonly unresolvedCount = signal(0);

  ngOnInit(): void {
    this.loadReports();
    this.loadUnresolvedCount();
  }

  loadReports(): void {
    this.loading.set(true);
    this.adminApi.getReports({ resolved: this.showResolved(), page: 1, pageSize: 50 }).subscribe({
      next: (result) => {
        this.reports.set(result.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadUnresolvedCount(): void {
    this.adminApi.getUnresolvedReportCount().subscribe({
      next: (result) => {
        this.unresolvedCount.set(result.count);
        this.countChanged.emit(result.count);
      },
    });
  }

  resolveReport(report: Report): void {
    this.adminApi.resolveReport(report.id).subscribe({
      next: () => {
        this.reports.update(list => list.filter(r => r.id !== report.id));
        this.loadUnresolvedCount();
      },
    });
  }

  deleteReportedComment(report: Report): void {
    if (!report.commentId) return;
    this.adminApi.deleteComment(report.commentId).subscribe({
      next: () => {
        this.reports.update(list => list.filter(r => r.id !== report.id));
        this.loadUnresolvedCount();
      },
    });
  }

  deleteReportedPhoto(report: Report): void {
    if (!report.photoId) return;
    this.adminApi.deletePhoto(report.photoId).subscribe({
      next: () => {
        this.reports.update(list => list.filter(r => r.id !== report.id));
        this.loadUnresolvedCount();
      },
    });
  }

  restoreComment(report: Report): void {
    if (!report.commentId) return;
    this.adminApi.restoreComment(report.commentId).subscribe({
      next: () => {
        this.reports.update(list =>
          list.map(r => r.id === report.id ? { ...r, resolutionAction: 'Restored' } : r));
      },
    });
  }

  restorePhoto(report: Report): void {
    if (!report.photoId) return;
    this.adminApi.restorePhoto(report.photoId).subscribe({
      next: () => {
        this.reports.update(list =>
          list.map(r => r.id === report.id ? { ...r, resolutionAction: 'Restored' } : r));
      },
    });
  }
}
