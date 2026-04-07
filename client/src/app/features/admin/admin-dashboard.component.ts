import { Component, signal, ElementRef, ViewChildren, QueryList, inject, OnInit } from '@angular/core';
import { AdminPhotosComponent } from './admin-photos.component';
import { AdminUsersComponent } from './admin-users.component';
import { AdminAuditLogComponent } from './admin-audit-log.component';
import { AdminLocationsComponent } from './admin-locations.component';
import { AdminReportsComponent } from './admin-reports.component';
import { AdminApiService } from '../../core/services/admin-api.service';

type AdminTab = 'reports' | 'photos' | 'users' | 'locations' | 'audit';

const TABS: AdminTab[] = ['reports', 'photos', 'users', 'locations', 'audit'];

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AdminPhotosComponent, AdminUsersComponent, AdminLocationsComponent, AdminAuditLogComponent, AdminReportsComponent],
  template: `
    <section class="max-w-screen-2xl mx-auto px-6 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-black text-on-surface font-headline tracking-tight">
          Panel Administracyjny
        </h1>
        <p class="text-on-surface-variant font-body mt-1">
          Zarządzaj treścią, użytkownikami i monitoruj aktywność systemu.
        </p>
      </div>

      <!-- Tab Navigation -->
      <div
        class="flex gap-1 mb-8 border-b border-outline-variant"
        role="tablist"
        aria-label="Zakładki panelu administracyjnego"
        (keydown)="onTabKeydown($event)">
        <button
          #tabButton
          id="tab-reports"
          role="tab"
          [attr.aria-selected]="activeTab() === 'reports'"
          [attr.aria-controls]="'panel-reports'"
          [attr.tabindex]="activeTab() === 'reports' ? 0 : -1"
          (click)="setTab('reports')"
          class="px-6 py-3 font-headline font-bold text-sm transition-colors min-h-[44px] -mb-px border-b-2 flex items-center gap-2"
          [class]="activeTab() === 'reports'
            ? 'text-error border-error'
            : 'text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline'">
          Zgłoszenia
          @if (unresolvedReportCount() > 0) {
            <span class="bg-error text-on-error rounded-full px-2 py-0.5 text-xs font-black">{{ unresolvedReportCount() }}</span>
          }
        </button>
        <button
          #tabButton
          id="tab-photos"
          role="tab"
          [attr.aria-selected]="activeTab() === 'photos'"
          [attr.aria-controls]="'panel-photos'"
          [attr.tabindex]="activeTab() === 'photos' ? 0 : -1"
          (click)="setTab('photos')"
          class="px-6 py-3 font-headline font-bold text-sm transition-colors min-h-[44px] -mb-px border-b-2"
          [class]="activeTab() === 'photos'
            ? 'text-primary border-primary'
            : 'text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline'">
          Zdjęcia
        </button>
        <button
          #tabButton
          id="tab-users"
          role="tab"
          [attr.aria-selected]="activeTab() === 'users'"
          [attr.aria-controls]="'panel-users'"
          [attr.tabindex]="activeTab() === 'users' ? 0 : -1"
          (click)="setTab('users')"
          class="px-6 py-3 font-headline font-bold text-sm transition-colors min-h-[44px] -mb-px border-b-2"
          [class]="activeTab() === 'users'
            ? 'text-primary border-primary'
            : 'text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline'">
          Użytkownicy
        </button>
        <button
          #tabButton
          id="tab-locations"
          role="tab"
          [attr.aria-selected]="activeTab() === 'locations'"
          [attr.aria-controls]="'panel-locations'"
          [attr.tabindex]="activeTab() === 'locations' ? 0 : -1"
          (click)="setTab('locations')"
          class="px-6 py-3 font-headline font-bold text-sm transition-colors min-h-[44px] -mb-px border-b-2"
          [class]="activeTab() === 'locations'
            ? 'text-primary border-primary'
            : 'text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline'">
          Lokalizacje
        </button>
        <button
          #tabButton
          id="tab-audit"
          role="tab"
          [attr.aria-selected]="activeTab() === 'audit'"
          [attr.aria-controls]="'panel-audit'"
          [attr.tabindex]="activeTab() === 'audit' ? 0 : -1"
          (click)="setTab('audit')"
          class="px-6 py-3 font-headline font-bold text-sm transition-colors min-h-[44px] -mb-px border-b-2"
          [class]="activeTab() === 'audit'
            ? 'text-primary border-primary'
            : 'text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline'">
          Dziennik Audytu
        </button>
      </div>

      <!-- Tab Panels -->
      @switch (activeTab()) {
        @case ('reports') {
          <div id="panel-reports" role="tabpanel" aria-labelledby="tab-reports" tabindex="0">
            <app-admin-reports (countChanged)="unresolvedReportCount.set($event)" />
          </div>
        }
        @case ('photos') {
          <div id="panel-photos" role="tabpanel" aria-labelledby="tab-photos" tabindex="0">
            <app-admin-photos />
          </div>
        }
        @case ('users') {
          <div id="panel-users" role="tabpanel" aria-labelledby="tab-users" tabindex="0">
            <app-admin-users />
          </div>
        }
        @case ('locations') {
          <div id="panel-locations" role="tabpanel" aria-labelledby="tab-locations" tabindex="0">
            <app-admin-locations />
          </div>
        }
        @case ('audit') {
          <div id="panel-audit" role="tabpanel" aria-labelledby="tab-audit" tabindex="0">
            <app-admin-audit-log />
          </div>
        }
      }
    </section>
  `,
})
export class AdminDashboardComponent implements OnInit {
  @ViewChildren('tabButton') tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;
  private readonly adminApi = inject(AdminApiService);

  activeTab = signal<AdminTab>('reports');
  unresolvedReportCount = signal(0);

  ngOnInit(): void {
    this.adminApi.getUnresolvedReportCount().subscribe({
      next: (result) => this.unresolvedReportCount.set(result.count),
    });
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
  }

  onTabKeydown(event: KeyboardEvent): void {
    const currentIndex = TABS.indexOf(this.activeTab());
    let newIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      newIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      newIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      newIndex = TABS.length - 1;
    } else {
      return;
    }

    this.activeTab.set(TABS[newIndex]);
    const buttons = this.tabButtons.toArray();
    buttons[newIndex]?.nativeElement.focus();
  }
}
