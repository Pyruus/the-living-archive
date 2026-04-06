import { Component, inject, signal, computed, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SearchService, HISTORICAL_PERIODS } from '../../core/services/search.service';
import { ArchiveMapComponent, LocationGroup } from '../../shared/components/map/archive-map.component';
import { LocationBrowserComponent } from '../../shared/components/location-browser/location-browser.component';
import { Photo, PhotoSearchItem, Comment } from '../../core/models/photo.model';
import { PhotoApiService } from '../../core/services/photo-api.service';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-explore-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ArchiveMapComponent,
    LocationBrowserComponent,
  ],
  template: `
    <!-- Hero & Map Section -->
    <section class="flex flex-col md:relative md:h-[665px] w-full bg-surface-container-low isolate">
      <!-- Search Interface (stacked on mobile, floating on desktop) -->
      <div class="relative z-20 md:absolute md:inset-0 md:pointer-events-none">
        <div class="md:max-w-screen-2xl md:mx-auto md:px-6 md:h-full md:flex md:flex-col md:justify-center">
          <div class="md:max-w-2xl glass-panel p-6 md:p-8 md:rounded-xl md:pointer-events-auto md:shadow-xl">
            <h1 class="text-2xl md:text-4xl font-black text-primary tracking-tighter mb-2 font-headline leading-tight">
              Historia w każdym kamieniu.
            </h1>
            <p class="text-on-surface-variant mb-6 md:mb-8 font-body text-base md:text-lg">
              Przeglądaj archiwum społecznościowe poprzez mapę i czas.
            </p>

            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Period -->
                <div class="space-y-1">
                  <label
                    for="period-select"
                    class="text-xs font-bold uppercase tracking-widest text-outline font-label">
                    Okres historyczny
                  </label>
                  <select
                    id="period-select"
                    class="w-full bg-surface-container-low border-b-2 border-outline focus:border-primary border-t-0 border-x-0 rounded-none py-2 text-on-surface focus:ring-0"
                    [ngModel]="search.period()"
                    (ngModelChange)="search.setPeriod($event)">
                    @for (p of periods; track p.value) {
                      <option [value]="p.value">{{ p.label }}</option>
                    }
                  </select>
                </div>

                <!-- Location cascading selects -->
                <div class="space-y-1">
                  <label class="text-xs font-bold uppercase tracking-widest text-outline font-label">
                    Lokalizacja
                  </label>
                  <div class="space-y-2">
                    <!-- Country -->
                    <select
                      class="w-full bg-surface-container-low border-b-2 border-outline focus:border-primary border-t-0 border-x-0 rounded-none py-2 text-on-surface focus:ring-0"
                      [ngModel]="selectedCountryId()"
                      (ngModelChange)="onCountryChange($event)"
                      aria-label="Wybierz kraj">
                      <option [ngValue]="null">Wszystkie kraje</option>
                      @for (c of countries(); track c.id) {
                        <option [ngValue]="c.id">{{ c.name }}</option>
                      }
                    </select>

                    <!-- City -->
                    @if (citiesForCountry().length > 0) {
                      <select
                        class="w-full bg-surface-container-low border-b-2 border-outline focus:border-primary border-t-0 border-x-0 rounded-none py-2 text-on-surface focus:ring-0"
                        [ngModel]="selectedCityId()"
                        (ngModelChange)="onCityChange($event)"
                        aria-label="Wybierz miasto">
                        <option [ngValue]="null">Wszystkie miasta</option>
                        @for (c of citiesForCountry(); track c.id) {
                          <option [ngValue]="c.id">{{ c.name }}</option>
                        }
                      </select>
                    }

                    <!-- District -->
                    @if (districtsForCity().length > 0) {
                      <select
                        class="w-full bg-surface-container-low border-b-2 border-outline focus:border-primary border-t-0 border-x-0 rounded-none py-2 text-on-surface focus:ring-0"
                        [ngModel]="selectedDistrictId()"
                        (ngModelChange)="onDistrictChange($event)"
                        aria-label="Wybierz dzielnicę">
                        <option [ngValue]="null">Wszystkie dzielnice</option>
                        @for (d of districtsForCity(); track d.id) {
                          <option [ngValue]="d.id">{{ d.name }}</option>
                        }
                      </select>
                    }
                  </div>
                </div>
              </div>

              <!-- Search query input -->
              <div class="relative">
                <input
                  type="text"
                  class="w-full bg-surface-container-low border-b-2 border-outline focus:border-primary border-t-0 border-x-0 rounded-none py-3 pl-4 pr-12 text-on-surface focus:ring-0 text-lg"
                  placeholder="Szukaj po tytule, opisie lub nazwisku…"
                  [attr.aria-label]="'Szukaj w archiwum'"
                  [ngModel]="search.query()"
                  (ngModelChange)="onQueryChange($event)" />
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
              </div>

              <!-- Reset filters button -->
              <button
                type="button"
                class="archival-gradient text-on-primary font-bold py-4 px-6 rounded-md shadow-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity mt-2 group"
                (click)="search.resetFilters()">
                <span class="material-symbols-outlined">restart_alt</span>
                Wyczyść filtry
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Map (below search on mobile, behind on desktop) -->
      <div class="h-[300px] md:absolute md:inset-0 md:h-full md:z-10">
        <app-archive-map
          [photos]="search.geoResults()"
          (markerClick)="onMarkerClick($event)"
          (locationClick)="onLocationGroupClick($event)" />
      </div>
    </section>

    <!-- Content area: sidebar + results -->
    <section class="max-w-screen-2xl mx-auto px-6 py-12 flex gap-8">
      <!-- Location sidebar (collapsible) -->
      @if (sidebarOpen()) {
        <aside class="w-80 shrink-0 hidden lg:block">
          <div class="sticky top-24 bg-surface-container-lowest p-6 rounded-xl shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h2 class="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-tertiary">account_tree</span>
              Struktura lokalizacji
            </h2>
            <app-location-browser />
          </div>
        </aside>
      }

      <!-- Results grid -->
      <div class="flex-1 min-w-0">
        <!-- Results header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              aria-label="Pokaż / ukryj panel lokalizacji"
              (click)="sidebarOpen.set(!sidebarOpen())">
              <span class="material-symbols-outlined">{{ sidebarOpen() ? 'left_panel_close' : 'left_panel_open' }}</span>
            </button>
            <h2 class="font-headline font-bold text-2xl text-on-surface">
              Wyniki wyszukiwania
            </h2>
            <p class="text-on-surface-variant text-sm mt-1">
              @if (search.loading()) {
                Wyszukiwanie…
              } @else {
                Znaleziono {{ search.totalCount() }} materiałów
                @if (search.selectedLocationName()) {
                  w „{{ search.selectedLocationName() }}"
                }
              }
            </p>
          </div>

          <!-- Active filters -->
          @if (search.query() || search.period() || search.selectedLocationId()) {
            <div class="flex flex-wrap gap-2">
              @if (search.query()) {
                <span class="glass-panel px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                  „{{ search.query() }}"
                  <button type="button" aria-label="Usuń filtr tekstu" (click)="search.setQuery('')">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              }
              @if (search.period()) {
                <span class="glass-panel px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                  {{ getPeriodLabel(search.period()) }}
                  <button type="button" aria-label="Usuń filtr okresu" (click)="search.setPeriod('')">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              }
              @if (search.selectedLocationName()) {
                <span class="glass-panel px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                  {{ search.selectedLocationName() }}
                  <button type="button" aria-label="Usuń filtr lokalizacji" (click)="clearLocationFilter()">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              }
            </div>
          }
        </div>

        @if (search.loading() && search.results().length === 0) {
          <div class="flex justify-center py-20" role="status" aria-live="polite">
            <span class="material-symbols-outlined text-4xl text-primary animate-spin" aria-hidden="true">progress_activity</span>
            <span class="sr-only">Wyszukiwanie zdjęć...</span>
          </div>
        } @else if (search.results().length === 0) {
          <div class="text-center py-20">
            <span class="material-symbols-outlined text-6xl text-outline/30 mb-4" style="font-variation-settings:'FILL' 1">search_off</span>
            <p class="text-on-surface-variant text-lg">Brak wyników dla wybranych filtrów.</p>
            <button
              type="button"
              class="mt-4 text-primary font-bold underline"
              (click)="search.resetFilters()">
              Wyczyść filtry
            </button>
          </div>
        } @else {
          <!-- Photo grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (photo of search.results(); track photo.id) {
              <article
                class="group relative bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer"
                tabindex="0"
                [attr.aria-label]="photo.title + (photo.location ? ', ' + photo.location : '')"
                role="link"
                (click)="onPhotoClick(photo)"
                (keydown.enter)="onPhotoClick(photo)"
                (keydown.space)="onPhotoClick(photo); $event.preventDefault()">
                <!-- Image -->
                <div class="aspect-[4/3] overflow-hidden bg-surface-container-high flex items-center justify-center">
                  @if (photo.filePath) {
                    <img
                      [src]="'/' + photo.filePath"
                      [alt]="photo.title"
                      class="w-full h-full object-cover" />
                  } @else {
                    <span class="material-symbols-outlined text-6xl text-outline/30" style="font-variation-settings:'FILL' 1">photo</span>
                  }
                </div>

                <!-- Card body -->
                <div class="p-6">
                  <p class="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
                    {{ photo.location }}{{ photo.photoDate ? ', ' + photo.photoDate : '' }}
                  </p>
                  <h3 class="font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    {{ photo.title }}
                  </h3>
                  @if (photo.description) {
                    <p class="text-on-surface-variant text-sm line-clamp-2 leading-relaxed">
                      {{ photo.description }}
                    </p>
                  }
                </div>
              </article>
            }
          </div>

          <!-- Load more -->
          @if (search.hasMore()) {
            <div class="mt-12 flex justify-center">
              <button
                type="button"
                class="bg-surface-container text-on-surface-variant px-8 py-3 rounded-full font-bold text-sm hover:bg-surface-container-high transition-colors"
                [disabled]="search.loading()"
                (click)="search.loadNextPage()">
                @if (search.loading()) {
                  Ładowanie…
                } @else {
                  Wczytaj więcej wspomnień
                }
              </button>
            </div>
          }
        }
      </div>
    </section>

    <!-- Photo Detail Modal -->
    @if (selectedPhoto()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Szczegóły: ' + selectedPhoto()!.title"
        (click)="closeModal()">
        <div
          class="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          (click)="$event.stopPropagation()">
          <!-- Image -->
          @if (selectedPhoto()!.filePath) {
            <div class="w-full max-h-[50vh] overflow-hidden rounded-t-2xl bg-surface-container-high flex items-center justify-center">
              <img
                [src]="'/' + selectedPhoto()!.filePath"
                [alt]="selectedPhoto()!.title"
                class="w-full h-full object-contain max-h-[50vh]" />
            </div>
          }

          <!-- Details -->
          <div class="p-6 md:p-8">
            <div class="flex justify-between items-start mb-4">
              <div>
                <p class="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
                  {{ selectedPhoto()!.location }}{{ selectedPhoto()!.photoDate ? ', ' + selectedPhoto()!.photoDate : '' }}
                </p>
                <h2 class="font-headline font-black text-2xl text-on-surface">
                  {{ selectedPhoto()!.title }}
                </h2>
              </div>
              <div class="flex items-center gap-1 -mr-2 -mt-2">
                <!-- Report photo -->
                @if (auth.isLoggedIn()) {
                  <button
                    type="button"
                    class="text-on-surface-variant hover:text-error p-2 transition-colors"
                    aria-label="Zgłoś zdjęcie"
                    (click)="showReportPhotoForm.set(!showReportPhotoForm())">
                    <span class="material-symbols-outlined text-xl">flag</span>
                  </button>
                }
                <!-- Admin delete -->
                @if (auth.isAdmin()) {
                  <button
                    type="button"
                    class="text-error hover:text-on-error-container p-2 transition-colors"
                    aria-label="Usuń zdjęcie (admin)"
                    (click)="adminDeletePhoto()">
                    <span class="material-symbols-outlined text-xl">delete</span>
                  </button>
                }
                <button
                  type="button"
                  class="text-on-surface-variant hover:text-on-surface p-2"
                  aria-label="Zamknij"
                  (click)="closeModal()">
                  <span class="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
            </div>

            <!-- Report photo form -->
            @if (showReportPhotoForm()) {
              <div class="bg-error-container/30 border border-error/20 rounded-xl p-4 mb-4">
                <p class="text-sm font-bold text-error mb-2">Zgłoś zdjęcie</p>
                <textarea
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-error"
                  rows="2"
                  placeholder="Podaj powód zgłoszenia…"
                  [ngModel]="reportPhotoReason()"
                  (ngModelChange)="reportPhotoReason.set($event)"></textarea>
                <div class="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    class="text-sm text-on-surface-variant px-3 py-1.5 hover:bg-surface-container rounded-lg transition-colors"
                    (click)="showReportPhotoForm.set(false)">
                    Anuluj
                  </button>
                  <button
                    type="button"
                    class="text-sm text-on-error bg-error px-3 py-1.5 rounded-lg font-bold hover:bg-error/90 transition-colors"
                    [disabled]="!reportPhotoReason()"
                    (click)="submitPhotoReport()">
                    Zgłoś
                  </button>
                </div>
              </div>
            }

            @if (selectedPhoto()!.description) {
              <p class="text-on-surface-variant font-body leading-relaxed mb-4">
                {{ selectedPhoto()!.description }}
              </p>
            }

            <div class="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-6">
              @if (selectedPhoto()!.createdAt) {
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-base" aria-hidden="true">calendar_today</span>
                  Przesłano: {{ selectedPhoto()!.createdAt | date : 'dd.MM.yyyy' }}
                </span>
              }
              @if (selectedPhoto()!.uploader) {
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-base" aria-hidden="true">person</span>
                  {{ selectedPhoto()!.uploader }}
                </span>
              }
            </div>

            <!-- Comments Section -->
            <div class="border-t border-outline-variant pt-6">
              <h3 class="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">forum</span>
                Komentarze
                @if (comments().length > 0) {
                  <span class="text-sm font-normal text-on-surface-variant">({{ comments().length }})</span>
                }
              </h3>

              <!-- Comment list -->
              @if (commentsLoading()) {
                <div class="flex justify-center py-4">
                  <span class="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
                </div>
              } @else if (comments().length === 0) {
                <p class="text-sm text-on-surface-variant py-4">Brak komentarzy. Bądź pierwszy!</p>
              } @else {
                <div class="space-y-4 mb-6">
                  @for (comment of comments(); track comment.id) {
                    <div class="flex gap-3 group">
                      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-sm text-primary">person</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-bold text-on-surface">{{ comment.author.displayName }}</span>
                          <span class="text-xs text-on-surface-variant">{{ comment.createdAt | date : 'dd.MM.yyyy HH:mm' }}</span>
                          @if (comment.isReported) {
                            <span class="text-xs text-on-surface-variant flex items-center gap-0.5">
                              <span class="material-symbols-outlined text-xs">flag</span>
                              Zgłoszono
                            </span>
                          }
                        </div>
                        <p class="text-sm text-on-surface-variant leading-relaxed">{{ comment.content }}</p>
                        <div class="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          @if (auth.isLoggedIn() && !comment.isReported) {
                            <button
                              type="button"
                              class="text-xs text-on-surface-variant hover:text-error flex items-center gap-0.5 transition-colors"
                              (click)="reportComment(comment)">
                              <span class="material-symbols-outlined text-xs">flag</span>
                              Zgłoś
                            </button>
                          }
                          @if (auth.isAdmin() || auth.userId() === comment.author.id) {
                            <button
                              type="button"
                              class="text-xs text-on-surface-variant hover:text-error flex items-center gap-0.5 transition-colors"
                              (click)="deleteComment(comment)">
                              <span class="material-symbols-outlined text-xs">delete</span>
                              Usuń
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Add comment -->
              @if (auth.isLoggedIn()) {
                <div class="flex gap-3 items-start">
                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span class="material-symbols-outlined text-sm text-primary">edit</span>
                  </div>
                  <div class="flex-1">
                    <textarea
                      class="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="2"
                      placeholder="Napisz komentarz…"
                      [ngModel]="newComment()"
                      (ngModelChange)="newComment.set($event)"
                      (keydown.control.enter)="submitComment()"></textarea>
                    <div class="flex justify-between items-center mt-2">
                      <span class="text-xs text-on-surface-variant">Ctrl+Enter aby wysłać</span>
                      <button
                        type="button"
                        class="text-sm text-on-primary bg-primary px-4 py-1.5 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        [disabled]="!newComment()"
                        (click)="submitComment()">
                        Wyślij
                      </button>
                    </div>
                  </div>
                </div>
              } @else {
                <p class="text-sm text-on-surface-variant">
                  <a href="/api/auth/login/google" class="text-primary font-bold hover:underline">Zaloguj się</a>,
                  aby dodać komentarz.
                </p>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Location Group Modal -->
    @if (selectedGroup()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Zdjęcia w lokalizacji: ' + selectedGroup()!.location"
        (click)="closeGroupModal()">
        <div
          class="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex justify-between items-center p-6 border-b border-outline-variant">
            <div>
              <p class="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
                {{ selectedGroup()!.photos.length }} zdjęć w lokalizacji
              </p>
              <h2 class="font-headline font-black text-2xl text-on-surface">
                {{ selectedGroup()!.location }}
              </h2>
            </div>
            <button
              type="button"
              class="text-on-surface-variant hover:text-on-surface p-2"
              aria-label="Zamknij"
              (click)="closeGroupModal()">
              <span class="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <!-- Photo grid -->
          <div class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            @for (photo of selectedGroup()!.photos; track photo.id) {
              <article
                class="group cursor-pointer rounded-xl overflow-hidden bg-surface-container-low hover:shadow-lg transition-all"
                tabindex="0"
                (click)="onGroupPhotoClick(photo)"
                (keydown.enter)="onGroupPhotoClick(photo)">
                <div class="aspect-[4/3] overflow-hidden bg-surface-container-high flex items-center justify-center">
                  @if (photo.filePath) {
                    <img
                      [src]="'/' + photo.filePath"
                      [alt]="photo.title"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  } @else {
                    <span class="material-symbols-outlined text-4xl text-outline/30" style="font-variation-settings:'FILL' 1">photo</span>
                  }
                </div>
                <div class="p-3">
                  <h3 class="font-headline font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {{ photo.title }}
                  </h3>
                  @if (photo.photoDate) {
                    <p class="text-xs text-on-surface-variant mt-0.5">{{ photo.photoDate }}</p>
                  }
                </div>
              </article>
            }
          </div>
        </div>
      </div>
    }

    <!-- Toast notification -->
    @if (toastMessage()) {
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-xl shadow-xl font-bold text-sm flex items-center gap-2 animate-fade-in">
        <span class="material-symbols-outlined text-base">check_circle</span>
        {{ toastMessage() }}
      </div>
    }

    <!-- CTA Section (from design) -->
    <section class="py-20 bg-surface-container-low text-center px-6">
      <span class="material-symbols-outlined text-tertiary text-6xl mb-6" style="font-variation-settings:'FILL' 1">add_photo_alternate</span>
      <h2 class="text-4xl font-black text-primary tracking-tighter font-headline mb-4">
        Masz w domu kawałek historii?
      </h2>
      <p class="text-xl text-on-surface-variant mb-10 max-w-2xl mx-auto font-body">
        Każde zdjęcie, list czy dokument to ważny element naszej wspólnej tożsamości.
        Pomóż nam budować Żywe Archiwum.
      </p>
      <a
        href="/upload"
        class="archival-gradient text-on-primary text-lg font-bold py-5 px-10 rounded-md shadow-xl inline-flex items-center justify-center gap-4 hover:scale-105 transition-transform">
        Dodaj Wspomnienie
        <span class="material-symbols-outlined" aria-hidden="true">publish</span>
      </a>
    </section>
  `,
})
export class ExplorePageComponent implements OnInit {
  readonly search = inject(SearchService);
  readonly photoApi = inject(PhotoApiService);
  readonly adminApi = inject(AdminApiService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly periods = HISTORICAL_PERIODS;
  readonly sidebarOpen = signal(true);
  readonly selectedPhoto = signal<PhotoSearchItem | null>(null);
  readonly selectedGroup = signal<LocationGroup | null>(null);
  private returnToGroup: LocationGroup | null = null;

  readonly comments = signal<Comment[]>([]);
  readonly commentsLoading = signal(false);
  readonly newComment = signal('');
  readonly showReportPhotoForm = signal(false);
  readonly reportPhotoReason = signal('');
  readonly toastMessage = signal<string | null>(null);

  readonly selectedCountryId = signal<string | null>(null);
  readonly selectedCityId = signal<string | null>(null);
  readonly selectedDistrictId = signal<string | null>(null);

  readonly countries = computed(() =>
    this.search.locations().filter(l => l.level === 'Country'),
  );

  readonly citiesForCountry = computed(() => {
    const countryId = this.selectedCountryId();
    if (!countryId) return [];
    return this.search.locations().filter(l => l.parentId === countryId && l.level === 'City');
  });

  readonly districtsForCity = computed(() => {
    const cityId = this.selectedCityId();
    if (!cityId) return [];
    return this.search.locations().filter(l => l.parentId === cityId && l.level === 'District');
  });

  private queryDebounceTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.search.refresh();

    const photoId = this.route.snapshot.queryParamMap.get('photo');
    if (photoId) {
      this.photoApi.getPhoto(photoId).subscribe({
        next: (photo) => this.openPhotoModal(photo),
      });
    }
  }

  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (this.selectedPhoto()) {
      this.closeModal();
    } else if (this.selectedGroup()) {
      this.closeGroupModal();
    }
  }

  onQueryChange(value: string): void {
    clearTimeout(this.queryDebounceTimer);
    this.queryDebounceTimer = setTimeout(() => {
      this.search.setQuery(value);
    }, 350);
  }

  onMarkerClick(photo: Photo): void {
    const match = this.search.results().find(r => r.id === photo.id);
    if (match) this.openPhotoModal(match);
  }

  onPhotoClick(photo: PhotoSearchItem): void {
    this.openPhotoModal(photo);
  }

  private openPhotoModal(photo: PhotoSearchItem): void {
    this.selectedPhoto.set(photo);
    this.comments.set([]);
    this.newComment.set('');
    this.showReportPhotoForm.set(false);
    this.reportPhotoReason.set('');
    this.loadComments(photo.id);
  }

  private loadComments(photoId: string): void {
    this.commentsLoading.set(true);
    this.photoApi.getComments(photoId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.commentsLoading.set(false);
      },
      error: () => this.commentsLoading.set(false),
    });
  }

  closeModal(): void {
    this.selectedPhoto.set(null);
    this.comments.set([]);
    if (this.returnToGroup) {
      this.selectedGroup.set(this.returnToGroup);
      this.returnToGroup = null;
    }
  }

  onLocationGroupClick(group: LocationGroup): void {
    this.selectedGroup.set(group);
  }

  closeGroupModal(): void {
    this.selectedGroup.set(null);
  }

  onGroupPhotoClick(photo: Photo): void {
    const match = this.search.results().find(r => r.id === photo.id);
    if (match) {
      this.returnToGroup = this.selectedGroup();
      this.selectedGroup.set(null);
      this.openPhotoModal(match);
    }
  }

  onCountryChange(id: string | null): void {
    this.selectedCountryId.set(id);
    this.selectedCityId.set(null);
    this.selectedDistrictId.set(null);
    this.search.selectLocation(id);
  }

  onCityChange(id: string | null): void {
    this.selectedCityId.set(id);
    this.selectedDistrictId.set(null);
    this.search.selectLocation(id ?? this.selectedCountryId());
  }

  onDistrictChange(id: string | null): void {
    this.selectedDistrictId.set(id);
    this.search.selectLocation(id ?? this.selectedCityId() ?? this.selectedCountryId());
  }

  clearLocationFilter(): void {
    this.selectedCountryId.set(null);
    this.selectedCityId.set(null);
    this.selectedDistrictId.set(null);
    this.search.selectLocation(null);
  }

  getPeriodLabel(value: string): string {
    return this.periods.find((p) => p.value === value)?.label ?? value;
  }

  submitComment(): void {
    const photo = this.selectedPhoto();
    const content = this.newComment()?.trim();
    if (!photo || !content) return;

    this.photoApi.addComment(photo.id, content).subscribe({
      next: (comment) => {
        this.comments.update(list => [...list, comment]);
        this.newComment.set('');
      },
    });
  }

  deleteComment(comment: Comment): void {
    if (this.auth.isAdmin()) {
      this.adminApi.deleteComment(comment.id).subscribe({
        next: () => this.comments.update(list => list.filter(c => c.id !== comment.id)),
      });
    } else {
      this.photoApi.deleteComment(comment.id).subscribe({
        next: () => this.comments.update(list => list.filter(c => c.id !== comment.id)),
      });
    }
  }

  reportComment(comment: Comment): void {
    this.photoApi.reportComment(comment.id, 'Zgłoszony przez użytkownika').subscribe({
      next: () => {
        this.comments.update(list =>
          list.map(c => c.id === comment.id ? { ...c, isReported: true } : c));
        this.showToast('Komentarz został zgłoszony');
      },
    });
  }

  submitPhotoReport(): void {
    const photo = this.selectedPhoto();
    const reason = this.reportPhotoReason()?.trim();
    if (!photo || !reason) return;

    this.photoApi.reportPhoto(photo.id, reason).subscribe({
      next: () => {
        this.showReportPhotoForm.set(false);
        this.reportPhotoReason.set('');
        this.showToast('Zdjęcie zostało zgłoszone');
      },
    });
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  adminDeletePhoto(): void {
    const photo = this.selectedPhoto();
    if (!photo) return;

    this.adminApi.deletePhoto(photo.id).subscribe({
      next: () => {
        this.closeModal();
        this.search.refresh();
      },
    });
  }
}
