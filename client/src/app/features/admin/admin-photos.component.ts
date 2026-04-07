import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { PhotoApiService } from '../../core/services/photo-api.service';
import { AdminPhoto } from '../../core/models/admin.model';
import { HierarchyNode } from '../../core/models/photo.model';

@Component({
  selector: 'app-admin-photos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <select
        [(ngModel)]="statusFilter"
        (ngModelChange)="loadPhotos()"
        class="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Filtruj według statusu">
        <option value="">Wszystkie statusy</option>
        <option value="Approved">Opublikowane</option>
        <option value="Rejected">Usunięte</option>
      </select>

      <input
        type="text"
        [(ngModel)]="queryFilter"
        (keyup.enter)="loadPhotos()"
        placeholder="Szukaj po tytule lub opisie..."
        class="flex-1 min-w-[200px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-on-surface font-body placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Szukaj zdjęć" />

      <button
        (click)="loadPhotos()"
        class="rounded-lg bg-primary px-6 py-2 text-on-primary font-headline font-bold hover:bg-primary/90 transition-colors min-h-[44px]">
        Szukaj
      </button>
    </div>

    <!-- Results -->
    @if (loading()) {
      <div class="text-center py-12 text-on-surface-variant font-body" role="status" aria-live="polite">
        Ładowanie zdjęć...
      </div>
    } @else {
      <div class="mb-4 text-sm text-on-surface-variant font-body">
        Znaleziono: {{ totalCount() }} zdjęć
      </div>

      <div class="overflow-x-auto rounded-xl border border-outline-variant">
        <table class="w-full text-left font-body" aria-label="Lista zdjęć do moderacji">
          <thead class="bg-surface-container-low">
            <tr>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Zdjęcie</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Tytuł</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Autor</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Lokalizacja</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Data</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Status</th>
              <th class="px-4 py-3 text-sm font-headline font-bold text-on-surface">Akcje</th>
            </tr>
          </thead>
          <tbody>
            @for (photo of photos(); track photo.id) {
              <tr class="border-t border-outline-variant hover:bg-surface-container-lowest transition-colors">
                <td class="px-4 py-3">
                  @if (photo.filePath) {
                    <img
                      [src]="'/' + photo.filePath"
                      [alt]="photo.title"
                      class="w-16 h-16 object-cover rounded-lg" />
                  } @else {
                    <div class="w-16 h-16 bg-surface-container-high rounded-lg flex items-center justify-center">
                      <span class="material-symbols-outlined text-2xl text-outline/30">photo</span>
                    </div>
                  }
                </td>
                <td class="px-4 py-3">
                  @if (editingId() === photo.id) {
                    <input
                      type="text"
                      [(ngModel)]="editTitle"
                      class="w-full rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-on-surface font-body focus:ring-2 focus:ring-primary focus:outline-none"
                      aria-label="Edytuj tytuł" />
                  } @else {
                    <span class="text-on-surface">{{ photo.title }}</span>
                  }
                </td>
                <td class="px-4 py-3 text-on-surface-variant text-sm">
                  {{ photo.uploader.displayName }}
                </td>
                <td class="px-4 py-3 text-on-surface-variant text-sm">
                  @if (editingId() === photo.id) {
                    <select
                      [(ngModel)]="editHierarchyNodeId"
                      class="w-full rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-on-surface font-body text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      aria-label="Edytuj lokalizację">
                      @for (loc of allLocations(); track loc.id) {
                        <option [value]="loc.id">{{ loc.name }} ({{ loc.level }})</option>
                      }
                    </select>
                  } @else {
                    {{ photo.location }}
                  }
                </td>
                <td class="px-4 py-3 text-on-surface-variant text-sm">
                  @if (editingId() === photo.id) {
                    <input
                      type="text"
                      [(ngModel)]="editPhotoDate"
                      class="w-full rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-on-surface font-body focus:ring-2 focus:ring-primary focus:outline-none"
                      aria-label="Edytuj datę" />
                  } @else {
                    {{ photo.photoDate || '—' }}
                  }
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block rounded-full px-3 py-1 text-xs font-bold"
                    [class]="statusClass(photo.status)">
                    {{ statusLabel(photo.status) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2 flex-wrap">
                    @if (editingId() === photo.id) {
                      <button
                        (click)="saveEdit(photo.id)"
                        class="rounded-lg bg-primary px-3 py-1.5 text-xs text-on-primary font-bold hover:bg-primary/90 transition-colors min-h-[44px]">
                        Zapisz
                      </button>
                      <button
                        (click)="cancelEdit()"
                        class="rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface font-bold hover:bg-surface-container-low transition-colors min-h-[44px]">
                        Anuluj
                      </button>
                    } @else {
                      <button
                        (click)="startEdit(photo)"
                        class="rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface font-bold hover:bg-surface-container-low transition-colors min-h-[44px]"
                        [attr.aria-label]="'Edytuj metadane ' + photo.title">
                        Edytuj
                      </button>
                      @if (photo.status === 'Rejected') {
                        <button
                          (click)="restorePhoto(photo)"
                          class="rounded-lg bg-primary px-3 py-1.5 text-xs text-on-primary font-bold hover:bg-primary/90 transition-colors min-h-[44px]"
                          [attr.aria-label]="'Przywróć ' + photo.title">
                          Przywróć
                        </button>
                      } @else {
                        <button
                          (click)="deletePhoto(photo)"
                          class="rounded-lg bg-error px-3 py-1.5 text-xs text-on-error font-bold hover:bg-error/90 transition-colors min-h-[44px]"
                          [attr.aria-label]="'Usuń ' + photo.title">
                          Usuń
                        </button>
                      }
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-on-surface-variant">
                  Brak zdjęć do wyświetlenia.
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
export class AdminPhotosComponent {
  private readonly api = inject(AdminApiService);
  private readonly photoApi = inject(PhotoApiService);

  photos = signal<AdminPhoto[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);
  editingId = signal<string | null>(null);
  allLocations = signal<HierarchyNode[]>([]);

  statusFilter = '';
  queryFilter = '';
  editTitle = '';
  editDescription = '';
  editPhotoDate = '';
  editHierarchyNodeId = '';
  pageSize = 20;

  totalPages = () => Math.ceil(this.totalCount() / this.pageSize);

  constructor() {
    this.loadPhotos();
    this.photoApi.getLocations().subscribe(locs => this.allLocations.set(locs));
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.api
      .getPhotos({
        status: this.statusFilter || undefined,
        query: this.queryFilter || undefined,
        page: this.currentPage(),
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.photos.set(result.data);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadPhotos();
  }

  startEdit(photo: AdminPhoto): void {
    this.editingId.set(photo.id);
    this.editTitle = photo.title;
    this.editDescription = photo.description;
    this.editPhotoDate = photo.photoDate ?? '';
    this.editHierarchyNodeId = photo.hierarchyNodeId;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(id: string): void {
    this.api
      .editPhotoMetadata(id, {
        title: this.editTitle,
        description: this.editDescription,
        photoDate: this.editPhotoDate || undefined,
        hierarchyNodeId: this.editHierarchyNodeId || undefined,
      })
      .subscribe(() => {
        this.editingId.set(null);
        this.loadPhotos();
      });
  }

  setStatus(id: string, status: string): void {
    this.api.setPhotoStatus(id, { status }).subscribe(() => this.loadPhotos());
  }

  deletePhoto(photo: AdminPhoto): void {
    if (!confirm(`Czy na pewno chcesz usunąć "${photo.title}"?`)) return;
    this.api.deletePhoto(photo.id).subscribe(() => this.loadPhotos());
  }

  restorePhoto(photo: AdminPhoto): void {
    this.api.restorePhoto(photo.id).subscribe(() => this.loadPhotos());
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-tertiary-container text-on-tertiary-container';
      case 'Rejected':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-secondary-container text-on-secondary-container';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Approved':
        return 'Opublikowane';
      case 'Rejected':
        return 'Usunięte';
      default:
        return status;
    }
  }
}
