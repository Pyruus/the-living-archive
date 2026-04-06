import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'app-location-browser',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav aria-label="Przeglądanie lokalizacji" class="space-y-2">
      <!-- "All" option -->
      <button
        type="button"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
        [class.bg-primary]="search.selectedLocationId() === null"
        [class.text-on-primary]="search.selectedLocationId() === null"
        [class.hover:bg-surface-container-high]="search.selectedLocationId() !== null"
        [attr.aria-current]="search.selectedLocationId() === null ? 'location' : null"
        (click)="search.selectLocation(null)">
        <span class="material-symbols-outlined text-xl">public</span>
        <span class="font-bold">Wszystkie lokalizacje</span>
      </button>

      <!-- Hierarchy tree -->
      @for (country of search.locationTree(); track country.id) {
        <div class="space-y-1">
          <!-- Country level -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
            [class.bg-primary]="search.selectedLocationId() === country.id"
            [class.text-on-primary]="search.selectedLocationId() === country.id"
            [class.hover:bg-surface-container-high]="search.selectedLocationId() !== country.id"
            [attr.aria-current]="search.selectedLocationId() === country.id ? 'location' : null"
            [attr.aria-expanded]="isExpanded(country.id)"
            (click)="onNodeClick(country.id)">
            <span class="material-symbols-outlined text-xl">flag</span>
            <span class="font-bold flex-1">{{ country.name }}</span>
            <span class="text-xs text-outline opacity-70">{{ country.photoCount }}</span>
            @if (country.children.length) {
              <span
                class="material-symbols-outlined text-lg transition-transform"
                [class.rotate-180]="isExpanded(country.id)"
                >expand_more</span>
            }
          </button>

          <!-- City level -->
          @if (isExpanded(country.id)) {
            <div class="ml-6 space-y-1" role="group" [attr.aria-label]="'Miasta w ' + country.name">
              @for (city of country.children; track city.id) {
                <div>
                  <button
                    type="button"
                    class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm transition-colors"
                    [class.bg-primary-container]="search.selectedLocationId() === city.id"
                    [class.text-on-primary-container]="search.selectedLocationId() === city.id"
                    [class.hover:bg-surface-container-high]="search.selectedLocationId() !== city.id"
                    [attr.aria-current]="search.selectedLocationId() === city.id ? 'location' : null"
                    [attr.aria-expanded]="isExpanded(city.id)"
                    (click)="onNodeClick(city.id)">
                    <span class="material-symbols-outlined text-lg">location_city</span>
                    <span class="font-medium flex-1">{{ city.name }}</span>
                    <span class="text-xs text-outline opacity-70">{{ city.photoCount }}</span>
                    @if (city.children.length) {
                      <span
                        class="material-symbols-outlined text-base transition-transform"
                        [class.rotate-180]="isExpanded(city.id)"
                        >expand_more</span>
                    }
                  </button>

                  <!-- District level -->
                  @if (isExpanded(city.id) && city.children.length) {
                    <div class="ml-6 space-y-1 mt-1" role="group" [attr.aria-label]="'Dzielnice w ' + city.name">
                      @for (district of city.children; track district.id) {
                        <button
                          type="button"
                          class="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-xs transition-colors"
                          [class.bg-tertiary-fixed]="search.selectedLocationId() === district.id"
                          [class.text-on-tertiary-fixed]="search.selectedLocationId() === district.id"
                          [class.hover:bg-surface-container-high]="search.selectedLocationId() !== district.id"
                          [attr.aria-current]="search.selectedLocationId() === district.id ? 'location' : null"
                          (click)="search.selectLocation(district.id)">
                          <span class="material-symbols-outlined text-base">holiday_village</span>
                          <span class="font-medium flex-1">{{ district.name }}</span>
                          <span class="text-xs text-outline opacity-60">{{ district.photoCount }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </nav>
  `,
})
export class LocationBrowserComponent {
  readonly search = inject(SearchService);

  private expandedIds = new Set<string>();

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  onNodeClick(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
    this.search.selectLocation(id);
  }
}
