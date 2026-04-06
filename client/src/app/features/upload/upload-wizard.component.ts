import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { PhotoApiService } from '../../core/services/photo-api.service';
import { HierarchyNode } from '../../core/models/photo.model';
import { SELECTABLE_PERIODS } from '../../core/constants/periods';
import { LocationPickerMapComponent } from '../../shared/components/map/location-picker-map.component';

type WizardStep = 1 | 2 | 3 | 4;

interface StepMeta {
  label: string;
  title: string;
  subtitle: string;
}

const STEPS: Record<WizardStep, StepMeta> = {
  1: {
    label: 'Prześlij',
    title: 'Krok 1: Prześlij zdjęcie',
    subtitle: 'Wybierz oryginalną fotografię lub skan dokumentu z dysku.',
  },
  2: {
    label: 'Dane',
    title: 'Krok 2: Opisz materiał',
    subtitle: 'Podaj tytuł, datę historyczną i opis zdjęcia.',
  },
  3: {
    label: 'Lokalizacja',
    title: 'Krok 3: Wskaż lokalizację',
    subtitle: 'Wybierz istniejącą lokalizację lub dodaj nową.',
  },
  4: {
    label: 'Podsumowanie',
    title: 'Krok 4: Podsumowanie',
    subtitle: 'Sprawdź dane i prześlij materiał do archiwum.',
  },
};

const LEVEL_LABELS: Record<string, string> = {
  Country: 'Kraj',
  City: 'Miasto',
  District: 'Dzielnica',
};

const CHILD_LEVEL: Record<string, string> = {
  Country: 'City',
  City: 'District',
};

@Component({
  selector: 'app-upload-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LocationPickerMapComponent],
  template: `
    <section class="flex-grow p-6 md:p-12 lg:p-16 max-w-4xl mx-auto w-full">
      <!-- Header -->
      <header class="mb-12">
        <h1
          class="text-4xl md:text-5xl font-black font-headline text-primary tracking-tight mb-4 uppercase">
          Nowy Materiał
        </h1>
        <p class="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          Pomóż nam zachować historię Twojej społeczności. Przejdź przez cztery
          proste kroki, aby dodać swoje wspomnienie do cyfrowego archiwum.
        </p>
      </header>

      <!-- Wizard Progress Indicator -->
      <nav aria-label="Kroki formularza" class="mb-16">
        <div class="grid grid-cols-4 w-full">
          @for (s of stepNumbers; track s; let last = $last) {
            <div
              class="flex flex-col items-center"
              [attr.aria-current]="s === currentStep() ? 'step' : null">
              <!-- Circle + line row -->
              <div class="flex items-center w-full">
                <!-- Left line (or invisible spacer for first step) -->
                <div
                  class="flex-1 h-1 rounded"
                  [class.bg-primary]="s > 1 && s <= currentStep()"
                  [class.bg-surface-container-high]="s > 1 && s > currentStep()"
                  [class.bg-transparent]="s === 1">
                </div>
                <span
                  class="flex items-center justify-center w-12 h-12 rounded-full shrink-0 text-lg font-bold transition-colors"
                  [class.bg-primary]="s <= currentStep()"
                  [class.text-on-primary]="s <= currentStep()"
                  [class.bg-surface-container-high]="s > currentStep()">
                  @if (s < currentStep()) {
                    <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">check</span>
                  } @else {
                    {{ s }}
                  }
                </span>
                <!-- Right line (or invisible spacer for last step) -->
                <div
                  class="flex-1 h-1 rounded"
                  [class.bg-primary]="!last && s < currentStep()"
                  [class.bg-surface-container-high]="!last && s >= currentStep()"
                  [class.bg-transparent]="last">
                </div>
              </div>
              <!-- Label -->
              <span
                class="mt-3 text-xs font-label uppercase tracking-widest font-bold text-center"
                [class.text-primary]="s <= currentStep()"
                [class.text-on-surface-variant]="s > currentStep()">
                {{ stepMeta[s].label }}
              </span>
            </div>
          }
        </div>
      </nav>

      <!-- Step Content -->
      <div
        class="bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-sm">
        <!-- Step Title -->
        <div class="mb-10">
          <h2 class="text-2xl font-headline font-bold text-on-surface mb-2">
            {{ stepMeta[currentStep()].title }}
          </h2>
          <p class="text-on-surface-variant">
            {{ stepMeta[currentStep()].subtitle }}
          </p>
        </div>

        @if (currentStep() === 1) {
          <div class="space-y-8">
            <div
              class="group relative border-4 border-dashed rounded-xl p-16 flex flex-col items-center justify-center transition-colors bg-surface-container-low/30"
              [class.border-primary]="fileSelected()"
              [class.border-outline-variant]="!fileSelected()"
              (dragover)="onDragOver($event)"
              (drop)="onDrop($event)">
              <input
                type="file"
                accept="image/*"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Prześlij zdjęcie"
                (change)="onFileSelect($event)" />

              @if (!fileSelected()) {
                <div
                  class="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-5xl text-primary">upload_file</span>
                </div>
                <p class="text-xl font-bold text-primary mb-2">
                  Przeciągnij i upuść plik tutaj
                </p>
                <p class="text-on-surface-variant font-medium">
                  lub kliknij, aby wybrać z komputera
                </p>
                <p class="mt-8 text-sm text-outline uppercase tracking-widest font-bold">
                  Maksymalny rozmiar: 25MB &bull; JPG, PNG, TIFF
                </p>
              } @else {
                <div class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span class="material-symbols-outlined text-5xl text-primary" style="font-variation-settings:'FILL' 1">check_circle</span>
                </div>
                <p class="text-xl font-bold text-primary mb-2">{{ fileName() }}</p>
                <p class="text-on-surface-variant font-medium">
                  Plik gotowy do przesłania. Kliknij „Kontynuuj".
                </p>
              }
            </div>
          </div>
        }

        @if (currentStep() === 2) {
          <div class="space-y-8" [formGroup]="metadataForm">
            <div>
              <label for="title" class="block text-sm font-label font-bold uppercase tracking-wider text-secondary mb-3">
                Tytuł materiału *
              </label>
              <input
                id="title"
                formControlName="title"
                type="text"
                class="w-full bg-surface-container-low border-b-2 border-outline focus:border-primary focus:ring-0 px-4 py-4 text-lg"
                placeholder="Np. Rynek Starego Miasta" />
              @if (metadataForm.get('title')?.touched && metadataForm.get('title')?.hasError('required')) {
                <p class="text-error text-sm mt-2" role="alert">Tytuł jest wymagany.</p>
              }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label for="photoDate" class="block text-sm font-label font-bold uppercase tracking-wider text-secondary mb-3">
                  Okres historyczny
                </label>
                <select
                  id="photoDate"
                  formControlName="photoDate"
                  class="w-full bg-surface-container-low border-b-2 border-outline focus:border-primary focus:ring-0 px-4 py-4 text-lg appearance-none">
                  <option value="">Wybierz okres…</option>
                  @for (p of periods; track p.value) {
                    <option [value]="p.value">{{ p.label }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <label for="description" class="block text-sm font-label font-bold uppercase tracking-wider text-secondary mb-3">
                Opis materiału
              </label>
              <textarea
                id="description"
                formControlName="description"
                rows="5"
                class="w-full bg-surface-container-low border-b-2 border-outline focus:border-primary focus:ring-0 px-4 py-4 text-lg resize-none"
                placeholder="Opisz co znajduje się na zdjęciu, kto na nim jest i jaka historia się z nim wiąże...">
              </textarea>
            </div>
          </div>
        }

        @if (currentStep() === 3) {
          <div class="space-y-6">
            @if (!locationsLoaded()) {
              <p class="text-on-surface-variant" role="status">Ładowanie lokalizacji…</p>
            } @else {
              <!-- Breadcrumb for selected path -->
              @if (selectedLocationId()) {
                <div class="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
                  <button type="button" class="text-primary font-bold hover:underline" (click)="clearLocationSelection()">
                    Wszystkie
                  </button>
                  @for (crumb of selectedBreadcrumbs(); track crumb.id) {
                    <span class="material-symbols-outlined text-xs" aria-hidden="true">chevron_right</span>
                    <span class="font-bold text-on-surface">{{ crumb.name }}</span>
                  }
                </div>
              }

              <!-- Location tree -->
              <div class="space-y-2">
                @if (visibleNodes().length === 0 && browsingParent()) {
                  <p class="text-sm text-on-surface-variant italic py-2">
                    Brak lokalizacji podrzędnych. Dodaj nową poniżej.
                  </p>
                }
                @for (node of visibleNodes(); track node.id) {
                  <button
                    type="button"
                    class="w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left"
                    [class.bg-primary-container]="selectedLocationId() === node.id"
                    [class.border-primary]="selectedLocationId() === node.id"
                    [class.bg-surface-container-low]="selectedLocationId() !== node.id"
                    [class.border-transparent]="selectedLocationId() !== node.id"
                    [class.hover:border-primary]="selectedLocationId() !== node.id"
                    [attr.aria-pressed]="selectedLocationId() === node.id"
                    (click)="selectLocation(node)">
                    <span class="material-symbols-outlined text-2xl"
                      [class.text-primary]="selectedLocationId() === node.id"
                      [class.text-tertiary]="selectedLocationId() !== node.id">
                      @switch (node.level) {
                        @case ('Country') { public }
                        @case ('City') { location_city }
                        @default { holiday_village }
                      }
                    </span>
                    <div class="flex-1">
                      <span class="font-bold text-on-surface">{{ node.name }}</span>
                      <span class="text-xs text-on-surface-variant ml-2">
                        {{ levelLabel(node.level) }} · {{ node.photoCount }} zdjęć
                      </span>
                    </div>
                    @if (hasChildren(node)) {
                      <span class="material-symbols-outlined text-on-surface-variant text-lg">chevron_right</span>
                    }
                  </button>
                }
              </div>

              <!-- Add new location button -->
              @if (!creatingLocation()) {
                <button
                  type="button"
                  class="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                  (click)="startCreatingLocation()">
                  <span class="material-symbols-outlined">add_location</span>
                  <span class="font-bold">
                    Dodaj nową lokalizację
                    @if (browsingParent()) {
                      w „{{ browsingParent()!.name }}"
                    }
                  </span>
                </button>
              }

              <!-- Create location form -->
              @if (creatingLocation()) {
                <div class="bg-surface-container-low p-6 rounded-xl space-y-4 border border-outline-variant">
                  <h3 class="font-headline font-bold text-on-surface">
                    Nowa lokalizacja
                    @if (browsingParent()) {
                      <span class="text-on-surface-variant font-normal text-sm">
                        ({{ newLocationLevelLabel() }} w „{{ browsingParent()!.name }}")
                      </span>
                    } @else {
                      <span class="text-on-surface-variant font-normal text-sm">(Kraj)</span>
                    }
                  </h3>

                  <div>
                    <label for="new-loc-name" class="block text-xs font-bold uppercase tracking-widest text-outline font-label mb-1">
                      Nazwa *
                    </label>
                    <input
                      id="new-loc-name"
                      type="text"
                      [(ngModel)]="newLocationName"
                      maxlength="256"
                      class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Np. Gdańsk, Wrzeszcz" />
                  </div>

                  <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-outline font-label mb-1">
                      Współrzędne (kliknij na mapie)
                    </label>
                    <app-location-picker-map
                      [latitude]="newLocationLat"
                      [longitude]="newLocationLng"
                      (coordinatesPicked)="onNewLocationCoords($event)" />
                  </div>

                  @if (createLocationError()) {
                    <p class="text-error text-sm" role="alert">{{ createLocationError() }}</p>
                  }

                  <div class="flex gap-3 justify-end">
                    <button
                      type="button"
                      class="rounded-lg border border-outline-variant px-5 py-2 text-on-surface font-bold hover:bg-surface-container transition-colors"
                      (click)="cancelCreatingLocation()">
                      Anuluj
                    </button>
                    <button
                      type="button"
                      class="rounded-lg bg-primary px-5 py-2 text-on-primary font-bold hover:bg-primary/90 transition-colors"
                      [disabled]="creatingLocationSaving() || !newLocationName.trim()"
                      (click)="saveNewLocation()">
                      @if (creatingLocationSaving()) {
                        Tworzenie…
                      } @else {
                        Utwórz lokalizację
                      }
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        }

        @if (currentStep() === 4) {
          <div class="space-y-8">
            <div class="glass-panel p-8 rounded-xl space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p class="text-xs font-label font-bold uppercase tracking-widest text-secondary mb-1">Tytuł</p>
                  <p class="text-lg font-headline font-bold text-on-surface">
                    {{ metadataForm.get('title')?.value }}
                  </p>
                </div>
                <div>
                  <p class="text-xs font-label font-bold uppercase tracking-widest text-secondary mb-1">Okres historyczny</p>
                  <p class="text-lg text-on-surface">{{ selectedPeriodLabel() }}</p>
                </div>
                <div>
                  <p class="text-xs font-label font-bold uppercase tracking-widest text-secondary mb-1">Lokalizacja</p>
                  <p class="text-lg text-on-surface">{{ selectedLocationName() }}</p>
                </div>
                <div>
                  <p class="text-xs font-label font-bold uppercase tracking-widest text-secondary mb-1">Plik</p>
                  <p class="text-lg text-on-surface">{{ fileName() }}</p>
                </div>
              </div>
              @if (metadataForm.get('description')?.value) {
                <div>
                  <p class="text-xs font-label font-bold uppercase tracking-widest text-secondary mb-1">Opis</p>
                  <p class="text-on-surface leading-relaxed">
                    {{ metadataForm.get('description')?.value }}
                  </p>
                </div>
              }
            </div>

            @if (submitError()) {
              <div class="bg-error-container text-on-error-container p-4 rounded-lg" role="alert">
                {{ submitError() }}
              </div>
            }
          </div>
        }

        <!-- Navigation -->
        <div class="flex items-center justify-between pt-12 border-t border-outline-variant mt-10">
          <button
            type="button"
            class="px-8 py-4 text-on-surface-variant font-bold uppercase tracking-widest hover:text-primary transition-colors disabled:opacity-30"
            [disabled]="currentStep() === 1"
            (click)="prev()">
            Wstecz
          </button>

          @if (currentStep() < 4) {
            <button
              type="button"
              class="archival-gradient text-on-primary px-12 py-4 rounded-md font-bold text-lg shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
              [disabled]="!canAdvance()"
              (click)="next()">
              Kontynuuj
            </button>
          } @else {
            <button
              type="button"
              class="archival-gradient text-on-primary px-12 py-4 rounded-md font-bold text-lg shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
              [disabled]="submitting()"
              (click)="submit()">
              @if (submitting()) {
                Przesyłanie…
              } @else {
                Prześlij do archiwum
              }
            </button>
          }
        </div>
      </div>

      <!-- Tip box -->
      <div class="mt-12 bg-tertiary-fixed p-8 rounded-xl flex gap-6 items-start">
        <span
          class="material-symbols-outlined text-tertiary-container text-4xl"
          style="font-variation-settings:'FILL' 1">lightbulb</span>
        <div>
          <h4 class="font-headline font-bold text-on-tertiary-fixed mb-2">Porada kuratora</h4>
          <p class="text-on-tertiary-fixed-variant leading-relaxed">
            Staraj się przesyłać zdjęcia w jak najwyższej rozdzielczości. Jeśli
            to możliwe, unikaj robienia zdjęć samym odbitkom telefonem –
            skanowanie daje znacznie lepszy efekt, który przetrwa pokolenia.
          </p>
        </div>
      </div>
    </section>
  `,
})
export class UploadWizardComponent {
  private readonly api = inject(PhotoApiService);
  private readonly router = inject(Router);

  readonly stepNumbers: WizardStep[] = [1, 2, 3, 4];
  readonly stepMeta = STEPS;
  readonly periods = SELECTABLE_PERIODS;

  readonly currentStep = signal<WizardStep>(1);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly fileSelected = signal(false);
  readonly fileName = signal('');
  private selectedFile: File | null = null;

  readonly metadataForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.maxLength(256)]),
    photoDate: new FormControl(''),
    description: new FormControl('', Validators.maxLength(2000)),
  });

  readonly locations = signal<HierarchyNode[]>([]);
  readonly locationsLoaded = signal(false);
  readonly selectedLocationId = signal<string | null>(null);
  readonly browsingParentId = signal<string | null>(null);

  readonly creatingLocation = signal(false);
  readonly creatingLocationSaving = signal(false);
  readonly createLocationError = signal<string | null>(null);
  newLocationName = '';
  newLocationLat: number | null = null;
  newLocationLng: number | null = null;

  readonly titleValid = signal(false);

  readonly browsingParent = computed(() => {
    const id = this.browsingParentId();
    return id ? this.locations().find(l => l.id === id) ?? null : null;
  });

  readonly visibleNodes = computed(() => {
    const parentId = this.browsingParentId();
    return this.locations().filter(l => l.parentId === parentId);
  });

  readonly selectedBreadcrumbs = computed(() => {
    const all = this.locations();
    const crumbs: HierarchyNode[] = [];
    let currentId = this.browsingParentId();
    while (currentId) {
      const node = all.find(l => l.id === currentId);
      if (!node) break;
      crumbs.unshift(node);
      currentId = node.parentId;
    }
    return crumbs;
  });

  readonly selectedLocationName = computed(() => {
    const id = this.selectedLocationId();
    return this.locations().find(l => l.id === id)?.name ?? '—';
  });

  readonly selectedPeriodLabel = computed(() => {
    const val = this.metadataForm.get('photoDate')?.value;
    return this.periods.find(p => p.value === val)?.label ?? '—';
  });

  readonly canAdvance = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return this.fileSelected();
      case 2:
        return this.titleValid();
      case 3:
        return this.selectedLocationId() !== null;
      default:
        return true;
    }
  });

  constructor() {
    this.api.getLocations().subscribe({
      next: (locs) => {
        this.locations.set(locs);
        this.locationsLoaded.set(true);
      },
      error: () => this.locationsLoaded.set(true),
    });

    this.metadataForm.get('title')!.statusChanges.subscribe(() => {
      this.titleValid.set(this.metadataForm.get('title')!.valid);
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) this.setFile(event.dataTransfer.files[0]);
  }

  private setFile(file: File): void {
    this.selectedFile = file;
    this.fileName.set(file.name);
    this.fileSelected.set(true);
  }

  levelLabel(level: string): string {
    return LEVEL_LABELS[level] ?? level;
  }

  hasChildren(node: HierarchyNode): boolean {
    return this.locations().some(l => l.parentId === node.id);
  }

  selectLocation(node: HierarchyNode): void {
    this.selectedLocationId.set(node.id);

    if (node.level !== 'District') {
      this.browsingParentId.set(node.id);
    }
  }

  clearLocationSelection(): void {
    this.browsingParentId.set(null);
    this.selectedLocationId.set(null);
  }

  readonly newLocationLevelLabel = computed(() => {
    const parent = this.browsingParent();
    if (!parent) return 'Kraj';
    return LEVEL_LABELS[CHILD_LEVEL[parent.level] ?? ''] ?? '';
  });

  startCreatingLocation(): void {
    this.creatingLocation.set(true);
    this.createLocationError.set(null);
    this.newLocationName = '';
    this.newLocationLat = null;
    this.newLocationLng = null;
  }

  cancelCreatingLocation(): void {
    this.creatingLocation.set(false);
  }

  onNewLocationCoords(coords: { lat: number; lng: number }): void {
    this.newLocationLat = coords.lat;
    this.newLocationLng = coords.lng;
  }

  saveNewLocation(): void {
    const name = this.newLocationName.trim();
    if (!name) return;

    const parent = this.browsingParent();
    const level = parent ? (CHILD_LEVEL[parent.level] ?? 'District') : 'Country';

    this.creatingLocationSaving.set(true);
    this.createLocationError.set(null);

    this.api.createLocation({
      parentId: parent?.id,
      name,
      level,
      latitude: this.newLocationLat ?? undefined,
      longitude: this.newLocationLng ?? undefined,
    }).subscribe({
      next: (created) => {
        this.locations.update(list => [...list, created]);
        this.selectedLocationId.set(created.id);
        this.creatingLocation.set(false);
        this.creatingLocationSaving.set(false);

        if (created.level !== 'District') {
          this.browsingParentId.set(created.id);
        }
      },
      error: (err) => {
        this.createLocationError.set(err?.error?.error ?? 'Nie udało się utworzyć lokalizacji.');
        this.creatingLocationSaving.set(false);
      },
    });
  }

  next(): void {
    if (this.currentStep() < 4 && this.canAdvance()) {
      this.currentStep.update(s => (s + 1) as WizardStep);
    }
  }

  prev(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => (s - 1) as WizardStep);
    }
  }

  submit(): void {
    if (this.submitting()) return;

    const locationId = this.selectedLocationId();
    if (!locationId) return;

    this.submitting.set(true);
    this.submitError.set(null);

    const form = this.metadataForm.value;

    this.api
      .uploadPhoto(
        {
          hierarchyNodeId: locationId,
          title: form.title!,
          description: form.description ?? undefined,
          photoDate: form.photoDate ?? undefined,
        },
        this.selectedFile ?? undefined,
      )
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/collection']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(
            err?.error?.error ?? 'Wystąpił błąd podczas przesyłania materiału.',
          );
        },
      });
  }
}
