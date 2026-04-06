import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'explore',
    loadComponent: () =>
      import('./features/explore/explore-page.component').then(
        (m) => m.ExplorePageComponent,
      ),
  },
  {
    path: 'upload',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/upload/upload-wizard.component').then(
        (m) => m.UploadWizardComponent,
      ),
  },
  {
    path: 'collection',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/collection/my-collection.component').then(
        (m) => m.MyCollectionComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback.component').then(
        (m) => m.AuthCallbackComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'explore',
  },
];
