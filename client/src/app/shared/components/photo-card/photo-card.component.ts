import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="group relative bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
      [class.opacity-80]="photo.status === 'Rejected'">
      <!-- Image -->
      <div
        class="aspect-[4/3] overflow-hidden bg-surface-container-high flex items-center justify-center"
        [class.blur-sm]="photo.status === 'Rejected'">
        @if (photo.filePath) {
          <img
            [src]="'/' + photo.filePath"
            [alt]="photo.title"
            class="w-full h-full object-cover" />
        } @else {
          <span
            class="material-symbols-outlined text-6xl text-outline/30"
            style="font-variation-settings:'FILL' 1"
            >photo</span>
        }
      </div>

      <!-- Status badge -->
      <div class="absolute top-4 left-4 flex gap-2">
        @switch (photo.status) {
          @case ('Approved') {
            <span
              class="glass-panel px-3 py-1 text-[10px] font-bold uppercase tracking-tighter rounded-full flex items-center gap-1 text-on-tertiary-container bg-tertiary-container">
              <span
                class="material-symbols-outlined text-xs"
                style="font-variation-settings:'FILL' 1"
                aria-hidden="true"
                >check_circle</span>
              Opublikowane
            </span>
          }
          @case ('Rejected') {
            <span
              class="glass-panel px-3 py-1 text-[10px] font-bold uppercase tracking-tighter rounded-full flex items-center gap-1 text-on-error-container bg-error-container">
              <span class="material-symbols-outlined text-xs" aria-hidden="true">cancel</span>
              Usunięte
            </span>
          }
        }
      </div>

      <!-- Card body -->
      <div class="p-6">
        <p
          class="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
          {{ photo.location }}{{ photo.photoDate ? ', ' + photo.photoDate : '' }}
        </p>
        <h3
          class="font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">
          {{ photo.title }}
        </h3>
        <div class="flex justify-between items-center">
          @if (photo.status === 'Rejected') {
            <span class="text-xs text-error font-medium">Usunięte przez administratora</span>
          } @else {
            <span class="text-xs text-on-surface-variant">
              Przesłano: {{ photo.createdAt | date : 'dd.MM.yyyy' }}
            </span>
          }

          <div class="flex gap-1">
            @if (photo.status !== 'Rejected') {
              <button
                type="button"
                class="text-primary hover:text-primary-container p-1"
                [attr.aria-label]="'Edytuj ' + photo.title"
                (click)="edit.emit(photo)">
                <span class="material-symbols-outlined text-xl">edit</span>
              </button>
            }
            <button
              type="button"
              class="text-error hover:text-on-error-container p-1"
              [attr.aria-label]="'Usuń ' + photo.title"
              (click)="delete.emit(photo)">
              <span class="material-symbols-outlined text-xl">delete</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class PhotoCardComponent {
  @Input({ required: true }) photo!: Photo;
  @Output() edit = new EventEmitter<Photo>();
  @Output() delete = new EventEmitter<Photo>();
}
