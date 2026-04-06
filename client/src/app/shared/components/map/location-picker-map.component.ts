import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  effect,
} from '@angular/core';
import * as L from 'leaflet';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-location-picker-map',
  standalone: true,
  template: `
    <div
      #mapContainer
      class="w-full rounded-xl overflow-hidden border border-outline-variant"
      [style.height]="height"
      role="application"
      aria-label="Kliknij na mapie, aby wybrać lokalizację">
    </div>
    @if (latitude != null && longitude != null) {
      <p class="text-xs text-on-surface-variant mt-2 font-body">
        Wybrano: {{ latitude!.toFixed(4) }}, {{ longitude!.toFixed(4) }}
      </p>
    } @else {
      <p class="text-xs text-on-surface-variant mt-2 font-body">
        Kliknij na mapie, aby oznaczyć lokalizację.
      </p>
    }
  `,
  styles: [`:host { display: block; }`],
})
export class LocationPickerMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() height = '300px';

  @Output() coordinatesPicked = new EventEmitter<{ lat: number; lng: number }>();

  private readonly themeService = inject(ThemeService);
  private map!: L.Map;
  private tileLayer!: L.TileLayer;
  private marker: L.Marker | null = null;
  private initialized = false;

  private static readonly LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  private static readonly DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  constructor() {
    effect(() => {
      const dark = this.themeService.isDark();
      if (this.initialized) {
        this.tileLayer.setUrl(
          dark ? LocationPickerMapComponent.DARK_TILES : LocationPickerMapComponent.LIGHT_TILES,
        );
      }
    });
  }

  private readonly pinIcon = L.divIcon({
    className: 'location-pin',
    html: `<div style="
      width: 28px; height: 28px;
      background: var(--color-primary, #003e6f);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  ngAfterViewInit(): void {
    const lat = this.latitude ?? 52.0;
    const lng = this.longitude ?? 19.0;
    const zoom = this.latitude != null ? 12 : 6;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [lat, lng],
      zoom,
      zoomControl: true,
    });

    const dark = this.themeService.isDark();
    this.tileLayer = L.tileLayer(
      dark ? LocationPickerMapComponent.DARK_TILES : LocationPickerMapComponent.LIGHT_TILES,
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      },
    ).addTo(this.map);

    if (this.latitude != null && this.longitude != null) {
      this.placeMarker(this.latitude, this.longitude);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.latitude = e.latlng.lat;
      this.longitude = e.latlng.lng;
      this.placeMarker(e.latlng.lat, e.latlng.lng);
      this.coordinatesPicked.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['latitude'] || changes['longitude']) {
      if (this.latitude != null && this.longitude != null) {
        this.placeMarker(this.latitude, this.longitude);
        this.map.setView([this.latitude, this.longitude], 12);
      }
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private placeMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon: this.pinIcon }).addTo(this.map);
    }
  }
}
