import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AdminLocation } from '../../core/models/admin.model';
import { LocationPickerMapComponent } from '../../shared/components/map/location-picker-map.component';

@Component({
  selector: 'app-admin-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationPickerMapComponent],
  template: `
    <!-- Actions bar -->
    <div class="flex flex-wrap gap-4 mb-6 items-center justify-between">
      <div class="text-sm text-on-surface-variant font-body">
        Łącznie: {{ locations().length }} lokalizacji
      </div>
      <button
        (click)="startCreate()"
        class="rounded-lg bg-primary px-6 py-2 text-on-primary font-headline font-bold hover:bg-primary/90 transition-colors min-h-[44px] flex items-center gap-2">
        <span class="material-symbols-outlined text-lg">add_location_alt</span>
        Dodaj lokalizację
      </button>
    </div>

    @if (loading()) {
      <div class="text-center py-12 text-on-surface-variant font-body" role="status" aria-live="polite">
        Ładowanie lokalizacji...
      </div>
    } @else {
      <!-- Tree view -->
      <div class="space-y-2">
        @for (country of countries(); track country.id) {
          <div class="rounded-xl border border-outline-variant overflow-hidden">
            <!-- Country row -->
            <div
              class="flex items-center gap-3 px-4 py-3 bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors"
              (click)="toggleExpanded(country.id)">
              <span class="material-symbols-outlined text-primary text-lg transition-transform"
                [class.rotate-90]="isExpanded(country.id)">
                chevron_right
              </span>
              <span class="material-symbols-outlined text-tertiary text-lg">public</span>
              <span class="font-headline font-bold text-on-surface flex-1">{{ country.name }}</span>
              <span class="text-xs text-on-surface-variant font-body">
                {{ country.photoCount }} zdjęć
              </span>
              @if (country.latitude != null) {
                <span class="text-xs text-outline font-body">
                  {{ country.latitude | number:'1.2-4' }}, {{ country.longitude | number:'1.2-4' }}
                </span>
              }
              <div class="flex gap-1">
                <button
                  (click)="startEdit(country); $event.stopPropagation()"
                  class="p-1.5 rounded hover:bg-surface-container-high transition-colors"
                  [attr.aria-label]="'Edytuj ' + country.name">
                  <span class="material-symbols-outlined text-lg text-on-surface-variant">edit</span>
                </button>
                <button
                  (click)="startCreateChild(country); $event.stopPropagation()"
                  class="p-1.5 rounded hover:bg-surface-container-high transition-colors"
                  [attr.aria-label]="'Dodaj miasto w ' + country.name">
                  <span class="material-symbols-outlined text-lg text-primary">add</span>
                </button>
                <button
                  (click)="deleteLocation(country); $event.stopPropagation()"
                  class="p-1.5 rounded hover:bg-error-container transition-colors"
                  [attr.aria-label]="'Usuń ' + country.name"
                  [disabled]="country.childCount > 0 || country.photoCount > 0">
                  <span class="material-symbols-outlined text-lg"
                    [class]="country.childCount > 0 || country.photoCount > 0 ? 'text-outline/30' : 'text-error'">delete</span>
                </button>
              </div>
            </div>

            <!-- Cities -->
            @if (isExpanded(country.id)) {
              @for (city of citiesOf(country.id); track city.id) {
                <div class="border-t border-outline-variant">
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 pl-12 bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer"
                    (click)="toggleExpanded(city.id)">
                    <span class="material-symbols-outlined text-sm transition-transform"
                      [class.rotate-90]="isExpanded(city.id)">
                      chevron_right
                    </span>
                    <span class="material-symbols-outlined text-tertiary text-base">location_city</span>
                    <span class="font-headline font-bold text-sm text-on-surface flex-1">{{ city.name }}</span>
                    <span class="text-xs text-on-surface-variant font-body">
                      {{ city.photoCount }} zdjęć
                    </span>
                    @if (city.latitude != null) {
                      <span class="text-xs text-outline font-body">
                        {{ city.latitude | number:'1.2-4' }}, {{ city.longitude | number:'1.2-4' }}
                      </span>
                    }
                    <div class="flex gap-1">
                      <button
                        (click)="startEdit(city); $event.stopPropagation()"
                        class="p-1.5 rounded hover:bg-surface-container-high transition-colors"
                        [attr.aria-label]="'Edytuj ' + city.name">
                        <span class="material-symbols-outlined text-base text-on-surface-variant">edit</span>
                      </button>
                      <button
                        (click)="startCreateChild(city); $event.stopPropagation()"
                        class="p-1.5 rounded hover:bg-surface-container-high transition-colors"
                        [attr.aria-label]="'Dodaj dzielnicę w ' + city.name">
                        <span class="material-symbols-outlined text-base text-primary">add</span>
                      </button>
                      <button
                        (click)="deleteLocation(city); $event.stopPropagation()"
                        class="p-1.5 rounded hover:bg-error-container transition-colors"
                        [attr.aria-label]="'Usuń ' + city.name"
                        [disabled]="city.childCount > 0 || city.photoCount > 0">
                        <span class="material-symbols-outlined text-base"
                          [class]="city.childCount > 0 || city.photoCount > 0 ? 'text-outline/30' : 'text-error'">delete</span>
                      </button>
                    </div>
                  </div>

                  <!-- Districts -->
                  @if (isExpanded(city.id)) {
                    @for (district of districtsOf(city.id); track district.id) {
                      <div class="border-t border-outline-variant">
                        <div class="flex items-center gap-3 px-4 py-2 pl-20 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                          <span class="material-symbols-outlined text-tertiary text-base">apartment</span>
                          <span class="font-body text-sm text-on-surface flex-1">{{ district.name }}</span>
                          <span class="text-xs text-on-surface-variant font-body">
                            {{ district.photoCount }} zdjęć
                          </span>
                          @if (district.latitude != null) {
                            <span class="text-xs text-outline font-body">
                              {{ district.latitude | number:'1.2-4' }}, {{ district.longitude | number:'1.2-4' }}
                            </span>
                          }
                          <div class="flex gap-1">
                            <button
                              (click)="startEdit(district)"
                              class="p-1.5 rounded hover:bg-surface-container-high transition-colors"
                              [attr.aria-label]="'Edytuj ' + district.name">
                              <span class="material-symbols-outlined text-base text-on-surface-variant">edit</span>
                            </button>
                            <button
                              (click)="deleteLocation(district)"
                              class="p-1.5 rounded hover:bg-error-container transition-colors"
                              [attr.aria-label]="'Usuń ' + district.name"
                              [disabled]="district.photoCount > 0">
                              <span class="material-symbols-outlined text-base"
                                [class]="district.photoCount > 0 ? 'text-outline/30' : 'text-error'">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>
              }

              @if (citiesOf(country.id).length === 0) {
                <div class="border-t border-outline-variant px-4 py-3 pl-12 text-sm text-on-surface-variant italic">
                  Brak miast w tym kraju.
                </div>
              }
            }
          </div>
        }

        @if (countries().length === 0 && !loading()) {
          <div class="text-center py-12 text-on-surface-variant">
            Brak lokalizacji. Dodaj pierwszą lokalizację.
          </div>
        }
      </div>
    }

    <!-- Create / Edit Modal -->
    @if (modalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="modalMode() === 'create' ? 'Dodaj lokalizację' : 'Edytuj lokalizację'"
        (click)="closeModal()">
        <div
          class="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          (click)="$event.stopPropagation()">

          <!-- Modal header -->
          <div class="flex justify-between items-center p-6 border-b border-outline-variant">
            <h2 class="font-headline font-bold text-xl text-on-surface">
              @if (modalMode() === 'create') {
                Dodaj lokalizację
              } @else {
                Edytuj lokalizację
              }
            </h2>
            <button
              type="button"
              class="text-on-surface-variant hover:text-on-surface p-2"
              aria-label="Zamknij"
              (click)="closeModal()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Form -->
          <form class="p-6 space-y-5" (ngSubmit)="saveModal()">
            <!-- Parent info (create mode) -->
            @if (modalMode() === 'create' && modalParent()) {
              <div class="text-sm text-on-surface-variant font-body">
                Dodawanie w: <span class="font-bold text-on-surface">{{ modalParent()!.name }}</span>
                ({{ levelLabel(modalParent()!.level) }})
              </div>
            }

            <!-- Level (create mode only) -->
            @if (modalMode() === 'create') {
              <div class="space-y-1">
                <label for="loc-level" class="text-xs font-bold uppercase tracking-widest text-outline font-label">
                  Poziom *
                </label>
                <select
                  id="loc-level"
                  required
                  [(ngModel)]="formLevel"
                  name="level"
                  [disabled]="!!modalParent()"
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60">
                  <option value="Country">Kraj</option>
                  <option value="City">Miasto</option>
                  <option value="District">Dzielnica</option>
                </select>
              </div>
            }

            <!-- Name -->
            <div class="space-y-1">
              <label for="loc-name" class="text-xs font-bold uppercase tracking-widest text-outline font-label">
                Nazwa *
              </label>
              <input
                id="loc-name"
                type="text"
                required
                maxlength="256"
                [(ngModel)]="formName"
                name="name"
                class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <!-- Coordinates -->
            <div class="space-y-1">
              <label class="text-xs font-bold uppercase tracking-widest text-outline font-label">
                Współrzędne (kliknij na mapie)
              </label>
              <app-location-picker-map
                [latitude]="formLat"
                [longitude]="formLng"
                height="250px"
                (coordinatesPicked)="onCoordsPicked($event)" />
              <div class="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label for="loc-lat" class="text-xs text-outline">Szerokość</label>
                  <input
                    id="loc-lat"
                    type="number"
                    step="0.0001"
                    [(ngModel)]="formLat"
                    name="lat"
                    class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label for="loc-lng" class="text-xs text-outline">Długość</label>
                  <input
                    id="loc-lng"
                    type="number"
                    step="0.0001"
                    [(ngModel)]="formLng"
                    name="lng"
                    class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>

            <!-- Error -->
            @if (modalError()) {
              <p class="text-error text-sm font-body" role="alert">{{ modalError() }}</p>
            }

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-outline-variant px-6 py-3 text-on-surface font-bold hover:bg-surface-container-low transition-colors"
                (click)="closeModal()">
                Anuluj
              </button>
              <button
                type="submit"
                class="rounded-lg bg-primary px-6 py-3 text-on-primary font-bold hover:bg-primary/90 transition-colors"
                [disabled]="modalSaving() || !formName.trim()">
                @if (modalSaving()) {
                  Zapisywanie…
                } @else if (modalMode() === 'create') {
                  Dodaj
                } @else {
                  Zapisz zmiany
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminLocationsComponent {
  private readonly api = inject(AdminApiService);

  readonly locations = signal<AdminLocation[]>([]);
  readonly loading = signal(false);
  readonly expandedIds = signal<Set<string>>(new Set());

  readonly modalOpen = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly modalParent = signal<AdminLocation | null>(null);
  readonly modalEditingId = signal<string | null>(null);
  readonly modalSaving = signal(false);
  readonly modalError = signal<string | null>(null);

  formName = '';
  formLevel = 'Country';
  formLat: number | null = null;
  formLng: number | null = null;

  readonly countries = computed(() =>
    this.locations().filter(l => l.level === 'Country'),
  );

  constructor() {
    this.loadLocations();
  }

  citiesOf(countryId: string): AdminLocation[] {
    return this.locations().filter(l => l.parentId === countryId && l.level === 'City');
  }

  districtsOf(cityId: string): AdminLocation[] {
    return this.locations().filter(l => l.parentId === cityId && l.level === 'District');
  }

  toggleExpanded(id: string): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  levelLabel(level: string): string {
    switch (level) {
      case 'Country': return 'Kraj';
      case 'City': return 'Miasto';
      case 'District': return 'Dzielnica';
      default: return level;
    }
  }

  startCreate(): void {
    this.modalMode.set('create');
    this.modalParent.set(null);
    this.modalEditingId.set(null);
    this.formName = '';
    this.formLevel = 'Country';
    this.formLat = null;
    this.formLng = null;
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  startCreateChild(parent: AdminLocation): void {
    this.modalMode.set('create');
    this.modalParent.set(parent);
    this.modalEditingId.set(null);
    this.formName = '';
    this.formLevel = parent.level === 'Country' ? 'City' : 'District';
    this.formLat = null;
    this.formLng = null;
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  startEdit(loc: AdminLocation): void {
    this.modalMode.set('edit');
    this.modalParent.set(null);
    this.modalEditingId.set(loc.id);
    this.formName = loc.name;
    this.formLevel = loc.level;
    this.formLat = loc.latitude;
    this.formLng = loc.longitude;
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  saveModal(): void {
    if (!this.formName.trim()) return;

    this.modalSaving.set(true);
    this.modalError.set(null);

    if (this.modalMode() === 'create') {
      this.api.createLocation({
        parentId: this.modalParent()?.id,
        name: this.formName.trim(),
        level: this.formLevel,
        latitude: this.formLat ?? undefined,
        longitude: this.formLng ?? undefined,
      }).subscribe({
        next: (created) => {
          this.locations.update(list => [...list, created]);
          this.modalSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.modalError.set(err.error?.error ?? 'Nie udało się dodać lokalizacji.');
          this.modalSaving.set(false);
        },
      });
    } else {
      const id = this.modalEditingId()!;
      this.api.updateLocation(id, {
        name: this.formName.trim(),
        latitude: this.formLat ?? undefined,
        longitude: this.formLng ?? undefined,
      }).subscribe({
        next: (updated) => {
          this.locations.update(list =>
            list.map(l => l.id === id ? { ...l, name: updated.name, slug: updated.slug, latitude: updated.latitude, longitude: updated.longitude } : l),
          );
          this.modalSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.modalError.set(err.error?.error ?? 'Nie udało się zapisać zmian.');
          this.modalSaving.set(false);
        },
      });
    }
  }

  deleteLocation(loc: AdminLocation): void {
    if (!confirm(`Czy na pewno chcesz usunąć "${loc.name}"?`)) return;

    this.api.deleteLocation(loc.id).subscribe({
      next: () => {
        this.locations.update(list => list.filter(l => l.id !== loc.id));
        if (loc.parentId) {
          this.locations.update(list =>
            list.map(l => l.id === loc.parentId ? { ...l, childCount: l.childCount - 1 } : l),
          );
        }
      },
      error: (err) => {
        alert(err.error?.error ?? 'Nie udało się usunąć lokalizacji.');
      },
    });
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  onCoordsPicked(coords: { lat: number; lng: number }): void {
    this.formLat = coords.lat;
    this.formLng = coords.lng;
  }

  private loadLocations(): void {
    this.loading.set(true);
    this.api.getLocations().subscribe({
      next: (locs) => {
        this.locations.set(locs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
