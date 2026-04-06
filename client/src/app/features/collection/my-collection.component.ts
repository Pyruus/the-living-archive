import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PhotoApiService } from '../../core/services/photo-api.service';
import { Photo } from '../../core/models/photo.model';
import { PhotoCardComponent } from '../../shared/components/photo-card/photo-card.component';
import { SELECTABLE_PERIODS } from '../../core/constants/periods';

type SortOption = 'newest' | 'oldest' | 'approved';

@Component({
  selector: 'app-my-collection',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PhotoCardComponent],
  template: `
    <main class="flex-1 p-8 md:p-12 bg-surface">
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1
            class="font-headline font-black text-4xl lg:text-5xl text-on-surface mb-2 tracking-tight">
            Twoje Archiwum
          </h1>
          <p class="text-on-surface-variant font-body text-lg">
            Zarządzaj swoją kolekcją wspomnień i historycznych fotografii.
          </p>
        </div>
        <a
          routerLink="/upload"
          class="flex items-center gap-3 bg-tertiary text-on-primary py-4 px-8 rounded-md font-bold shadow-xl hover:translate-y-[-2px] transition-all duration-300 group">
          <span
            class="material-symbols-outlined group-hover:rotate-90 transition-transform"
            >add</span>
          Prześlij nowe zdjęcie
        </a>
      </div>

      <!-- Stats (Bento) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <!-- Total -->
        <div
          class="bg-surface-container-lowest p-8 rounded-xl shadow-sm border-b-4 border-primary/10">
          <div class="flex justify-between items-start mb-4">
            <span class="material-symbols-outlined text-primary text-3xl"
              >photo_library</span>
            <span
              class="text-xs font-bold uppercase tracking-widest text-outline"
              >Ogółem</span>
          </div>
          <div class="text-4xl font-black font-headline text-on-surface">
            {{ totalCount() }}
          </div>
          <div class="text-sm text-on-surface-variant mt-1">Twoje zdjęcia</div>
        </div>
        <!-- Published -->
        <div
          class="bg-surface-container-lowest p-8 rounded-xl shadow-sm border-b-4 border-emerald-600/10">
          <div class="flex justify-between items-start mb-4">
            <span
              class="material-symbols-outlined text-emerald-600 text-3xl"
              >public</span>
            <span
              class="text-xs font-bold uppercase tracking-widest text-outline"
              >Widoczne</span>
          </div>
          <div class="text-4xl font-black font-headline text-on-surface">
            {{ approvedCount() }}
          </div>
          <div class="text-sm text-on-surface-variant mt-1">Opublikowane</div>
        </div>
      </div>

      <!-- Collection Section -->
      <section>
        <div
          class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 class="font-headline font-bold text-2xl text-on-surface">
            Moja Kolekcja
          </h2>
          <div class="flex gap-4 items-center">
            <select
              class="bg-surface-container-low border-none rounded-lg text-sm font-medium py-2 px-4 focus:ring-primary"
              [attr.aria-label]="'Sortuj kolekcję'"
              (change)="onSortChange($event)">
              <option value="newest">Najnowsze</option>
              <option value="oldest">Najstarsze</option>
              <option value="approved">Status: Opublikowane</option>
            </select>
            <button
              type="button"
              class="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
              (click)="toggleStatusFilter()">
              <span class="material-symbols-outlined">filter_list</span>
              @if (activeFilter()) {
                {{ activeFilter() === 'Approved' ? 'Opublikowane' : 'Usunięte' }}
              } @else {
                Filtruj
              }
            </button>
          </div>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-20" role="status" aria-live="polite">
            <span
              class="material-symbols-outlined text-4xl text-primary animate-spin"
              aria-hidden="true"
              >progress_activity</span>
            <span class="sr-only">Ładowanie kolekcji...</span>
          </div>
        } @else if (sortedPhotos().length === 0) {
          <div class="text-center py-20">
            <span
              class="material-symbols-outlined text-6xl text-outline/30 mb-4"
              style="font-variation-settings:'FILL' 1"
              >photo_library</span>
            <p class="text-on-surface-variant text-lg">
              Twoja kolekcja jest pusta.
              <a routerLink="/upload" class="text-primary font-bold underline"
                >Prześlij pierwsze zdjęcie.</a>
            </p>
          </div>
        } @else {
          <!-- Photo Grid -->
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (photo of sortedPhotos(); track photo.id) {
              <app-photo-card
                [photo]="photo"
                (edit)="onEdit($event)"
                (delete)="onDelete($event)" />
            }
          </div>

          <!-- Load more -->
          @if (hasMore()) {
            <div class="mt-12 flex justify-center">
              <button
                type="button"
                class="bg-surface-container text-on-surface-variant px-8 py-3 rounded-full font-bold text-sm hover:bg-surface-container-high transition-colors"
                (click)="loadMore()">
                Wczytaj więcej wspomnień
              </button>
            </div>
          }
        }
      </section>

      <!-- Edit Modal -->
      @if (editingPhoto()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="'Edytuj ' + editingPhoto()!.title"
          (click)="cancelEdit()">
          <div
            class="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            (click)="$event.stopPropagation()">

            <!-- Modal header -->
            <div class="flex justify-between items-center p-6 border-b border-outline-variant">
              <h2 class="font-headline font-bold text-xl text-on-surface">Edytuj zdjęcie</h2>
              <button
                type="button"
                class="text-on-surface-variant hover:text-on-surface p-2"
                aria-label="Zamknij"
                (click)="cancelEdit()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Image preview -->
            @if (editingPhoto()!.filePath) {
              <div class="aspect-[16/9] overflow-hidden bg-surface-container-high flex items-center justify-center">
                <img
                  [src]="'/' + editingPhoto()!.filePath"
                  [alt]="editingPhoto()!.title"
                  class="w-full h-full object-contain" />
              </div>
            }

            <!-- Form -->
            <form class="p-6 space-y-5" (ngSubmit)="saveEdit()">
              <!-- Title -->
              <div class="space-y-1">
                <label for="edit-title" class="text-xs font-bold uppercase tracking-widest text-outline font-label">
                  Tytuł *
                </label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  maxlength="256"
                  [(ngModel)]="editTitle"
                  name="title"
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <!-- Description -->
              <div class="space-y-1">
                <label for="edit-description" class="text-xs font-bold uppercase tracking-widest text-outline font-label">
                  Opis
                </label>
                <textarea
                  id="edit-description"
                  rows="4"
                  maxlength="2000"
                  [(ngModel)]="editDescription"
                  name="description"
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary resize-y"></textarea>
              </div>

              <!-- Historical Period -->
              <div class="space-y-1">
                <label for="edit-date" class="text-xs font-bold uppercase tracking-widest text-outline font-label">
                  Okres historyczny
                </label>
                <select
                  id="edit-date"
                  [(ngModel)]="editPhotoDate"
                  name="photoDate"
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Wybierz okres…</option>
                  @for (p of periods; track p.value) {
                    <option [value]="p.value">{{ p.label }}</option>
                  }
                </select>
              </div>

              <!-- Error -->
              @if (editError()) {
                <p class="text-error text-sm font-body" role="alert">{{ editError() }}</p>
              }

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  class="rounded-lg border border-outline-variant px-6 py-3 text-on-surface font-bold hover:bg-surface-container-low transition-colors"
                  (click)="cancelEdit()">
                  Anuluj
                </button>
                <button
                  type="submit"
                  class="rounded-lg bg-primary px-6 py-3 text-on-primary font-bold hover:bg-primary/90 transition-colors"
                  [disabled]="editSaving() || !editTitle.trim()">
                  @if (editSaving()) {
                    Zapisywanie…
                  } @else {
                    Zapisz zmiany
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </main>
  `,
})
export class MyCollectionComponent implements OnInit {
  private readonly api = inject(PhotoApiService);

  readonly photos = signal<Photo[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly hasMore = signal(true);
  readonly sort = signal<SortOption>('newest');
  readonly activeFilter = signal<string | null>(null);
  readonly periods = SELECTABLE_PERIODS;

  readonly editingPhoto = signal<Photo | null>(null);
  readonly editSaving = signal(false);
  readonly editError = signal<string | null>(null);
  editTitle = '';
  editDescription = '';
  editPhotoDate = '';

  readonly totalCount = computed(() => this.photos().length);
  readonly approvedCount = computed(
    () => this.photos().filter((p) => p.status === 'Approved').length,
  );
  readonly pendingCount = computed(
    () => this.photos().filter((p) => p.status === 'Pending').length,
  );

  readonly sortedPhotos = computed(() => {
    let list = [...this.photos()];

    const filter = this.activeFilter();
    if (filter) {
      list = list.filter((p) => p.status === filter);
    }

    switch (this.sort()) {
      case 'newest':
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case 'oldest':
        list.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case 'approved':
        list.sort((a, b) => {
          if (a.status === 'Approved' && b.status !== 'Approved') return -1;
          if (a.status !== 'Approved' && b.status === 'Approved') return 1;
          return 0;
        });
        break;
    }

    return list;
  });

  ngOnInit(): void {
    this.fetchPhotos();
  }

  onSortChange(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as SortOption);
  }

  toggleStatusFilter(): void {
    const cycle: (string | null)[] = [null, 'Approved', 'Rejected'];
    const idx = cycle.indexOf(this.activeFilter());
    this.activeFilter.set(cycle[(idx + 1) % cycle.length]);
  }

  loadMore(): void {
    this.currentPage.update((p) => p + 1);
    this.fetchPhotos(true);
  }

  @HostListener('document:keydown.escape')
  onEscKey(): void {
    this.cancelEdit();
  }

  onEdit(photo: Photo): void {
    this.editingPhoto.set(photo);
    this.editTitle = photo.title;
    this.editDescription = photo.description;
    this.editPhotoDate = photo.photoDate ?? '';
    this.editError.set(null);
  }

  cancelEdit(): void {
    this.editingPhoto.set(null);
    this.editError.set(null);
  }

  saveEdit(): void {
    const photo = this.editingPhoto();
    if (!photo || !this.editTitle.trim()) return;

    this.editSaving.set(true);
    this.editError.set(null);

    this.api.updatePhoto(photo.id, {
      title: this.editTitle.trim(),
      description: this.editDescription.trim() || undefined,
      photoDate: this.editPhotoDate.trim() || undefined,
    }).subscribe({
      next: () => {
        this.photos.update(list =>
          list.map(p => p.id === photo.id
            ? { ...p, title: this.editTitle.trim(), description: this.editDescription.trim(), photoDate: this.editPhotoDate.trim() || null }
            : p
          )
        );
        this.editingPhoto.set(null);
        this.editSaving.set(false);
      },
      error: () => {
        this.editError.set('Nie udało się zapisać zmian. Spróbuj ponownie.');
        this.editSaving.set(false);
      },
    });
  }

  onDelete(photo: Photo): void {
    if (!confirm(`Czy na pewno chcesz usunąć „${photo.title}"?`)) return;

    this.api.deletePhoto(photo.id).subscribe({
      next: () => {
        this.photos.update((list) => list.filter((p) => p.id !== photo.id));
      },
    });
  }

  private fetchPhotos(append = false): void {
    if (!append) this.loading.set(true);

    this.api.getMyPhotos(this.currentPage(), 20).subscribe({
      next: (data) => {
        if (append) {
          this.photos.update((prev) => [...prev, ...data]);
        } else {
          this.photos.set(data);
        }
        this.hasMore.set(data.length === 20);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
