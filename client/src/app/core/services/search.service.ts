import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { PhotoApiService } from './photo-api.service';
import {
  PhotoSearchItem,
  HierarchyNode,
  SearchParams,
} from '../models/photo.model';

export { HISTORICAL_PERIODS } from '../constants/periods';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(PhotoApiService);

  readonly query = signal('');
  readonly period = signal('');
  readonly selectedLocationId = signal<string | null>(null);
  readonly currentPage = signal(1);

  readonly results = signal<PhotoSearchItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);

  readonly locations = signal<HierarchyNode[]>([]);
  readonly locationsLoaded = signal(false);

  readonly locationTree = computed(() => {
    const flat = this.locations();
    const roots = flat.filter((n) => n.parentId === null);
    const childrenOf = (parentId: string) =>
      flat.filter((n) => n.parentId === parentId);

    return roots.map((root) => ({
      ...root,
      children: childrenOf(root.id).map((city) => ({
        ...city,
        children: childrenOf(city.id),
      })),
    }));
  });

  readonly selectedLocationName = computed(() => {
    const id = this.selectedLocationId();
    if (!id) return null;
    return this.locations().find((l) => l.id === id)?.name ?? null;
  });

  readonly hasMore = computed(
    () => this.results().length < this.totalCount(),
  );

  readonly geoResults = computed(() =>
    this.results().filter((p) => p.latitude != null && p.longitude != null),
  );

  constructor() {
    this.loadLocations();

    effect(() => {
      this.query();
      this.period();
      this.selectedLocationId();
      this.currentPage.set(1);
      this.executeSearch(false);
    }, { allowSignalWrites: true });
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  setPeriod(value: string): void {
    this.period.set(value);
  }

  selectLocation(id: string | null): void {
    this.selectedLocationId.set(id);
  }

  loadNextPage(): void {
    this.currentPage.update((p) => p + 1);
    this.executeSearch(true);
  }

  resetFilters(): void {
    this.query.set('');
    this.period.set('');
    this.selectedLocationId.set(null);
  }

  refresh(): void {
    this.loadLocations();
    this.executeSearch(false);
  }

  private loadLocations(): void {
    this.api.getLocations().subscribe({
      next: (locs) => {
        this.locations.set(locs);
        this.locationsLoaded.set(true);
      },
    });
  }

  private executeSearch(append: boolean): void {
    this.loading.set(true);

    const params: SearchParams = {
      query: this.query() || undefined,
      period: this.period() || undefined,
      locationId: this.selectedLocationId() ?? undefined,
      page: this.currentPage(),
      pageSize: 20,
    };

    this.api.searchPhotos(params).subscribe({
      next: (res) => {
        if (append) {
          this.results.update((prev) => [...prev, ...res.data]);
        } else {
          this.results.set(res.data);
        }
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
