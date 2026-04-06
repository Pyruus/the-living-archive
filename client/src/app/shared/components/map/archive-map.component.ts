import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  SimpleChanges,
  inject,
  effect,
} from '@angular/core';
import * as L from 'leaflet';
import { Photo } from '../../../core/models/photo.model';
import { ThemeService } from '../../../core/services/theme.service';

// Fix Leaflet default icon paths broken by Angular bundling
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';

export interface LocationGroup {
  location: string;
  lat: number;
  lng: number;
  photos: Photo[];
}

@Component({
  selector: 'app-archive-map',
  standalone: true,
  template: `
    <div
      #mapContainer
      class="w-full h-full rounded-xl overflow-hidden"
      role="application"
      [attr.aria-label]="'Interaktywna mapa archiwum z ' + photos.length + ' punktami'">
    </div>
  `,
  styles: [`:host { display: block; width: 100%; height: 100%; }`],
})
export class ArchiveMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input() photos: Photo[] = [];
  @Input() centerLat = 52.23;
  @Input() centerLng = 21.01;
  @Input() zoom = 6;

  @Output() markerClick = new EventEmitter<Photo>();
  @Output() locationClick = new EventEmitter<LocationGroup>();

  private readonly themeService = inject(ThemeService);
  private map!: L.Map;
  private markerLayer = L.layerGroup();
  private tileLayer!: L.TileLayer;
  private initialized = false;

  private static readonly LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  private static readonly DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  private makeIcon(count: number): L.DivIcon {
    const size = count > 1 ? 40 : 32;
    const badge = count > 1
      ? `<span style="
          position: absolute; top: -6px; right: -6px;
          background: #ba1a1a; color: white;
          font-size: 11px; font-weight: 700;
          min-width: 20px; height: 20px;
          border-radius: 10px; display: flex;
          align-items: center; justify-content: center;
          padding: 0 4px; border: 2px solid #fafaf5;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${count}</span>`
      : '';

    return L.divIcon({
      className: 'archive-marker',
      html: `<div style="
        position: relative;
        width: ${size}px; height: ${size}px;
        background: #642d00;
        border: 2px solid #fafaf5;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <span class="material-symbols-outlined" style="color: white; font-size: ${count > 1 ? 18 : 16}px; font-variation-settings: 'FILL' 1;" aria-hidden="true">
          ${count > 1 ? 'photo_library' : 'photo_camera'}
        </span>
        ${badge}
      </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size - 2],
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['photos'] && this.initialized) {
      this.updateMarkers();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  constructor() {
    effect(() => {
      const dark = this.themeService.isDark();
      if (this.initialized) {
        this.tileLayer.setUrl(
          dark ? ArchiveMapComponent.DARK_TILES : ArchiveMapComponent.LIGHT_TILES,
        );
      }
    });
  }

  private initMap(): void {
    const dark = this.themeService.isDark();

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.centerLat, this.centerLng],
      zoom: this.zoom,
      zoomControl: false,
    });

    this.tileLayer = L.tileLayer(
      dark ? ArchiveMapComponent.DARK_TILES : ArchiveMapComponent.LIGHT_TILES,
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      },
    ).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.markerLayer.addTo(this.map);
    this.initialized = true;
    this.updateMarkers();
  }

  private updateMarkers(): void {
    this.markerLayer.clearLayers();

    const geoPhotos = this.photos.filter(
      (p) => p.latitude != null && p.longitude != null,
    );

    if (geoPhotos.length === 0) return;

    const groups = new Map<string, LocationGroup>();
    for (const photo of geoPhotos) {
      const key = `${photo.latitude!.toFixed(4)},${photo.longitude!.toFixed(4)}`;
      if (!groups.has(key)) {
        groups.set(key, {
          location: photo.location,
          lat: photo.latitude!,
          lng: photo.longitude!,
          photos: [],
        });
      }
      groups.get(key)!.photos.push(photo);
    }

    for (const group of groups.values()) {
      const count = group.photos.length;
      const marker = L.marker([group.lat, group.lng], {
        icon: this.makeIcon(count),
        title: count > 1
          ? `${group.location} (${count} zdjęć)`
          : group.photos[0].title,
        alt: group.location,
      });

      if (count === 1) {
        marker.on('click', () => this.markerClick.emit(group.photos[0]));
      } else {
        marker.on('click', () => this.locationClick.emit(group));
      }

      marker.addTo(this.markerLayer);
    }

    const coords = Array.from(groups.values()).map(g => [g.lat, g.lng] as L.LatLngTuple);
    if (coords.length > 1) {
      this.map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 14 });
    } else {
      this.map.setView(coords[0], 13);
    }
  }
}
