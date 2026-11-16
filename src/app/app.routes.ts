import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./pages/library/library.component').then((m) => m.LibraryComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./pages/add-game/add-game.component').then((m) => m.AddGameComponent),
  },
  {
    path: 'game/:id',
    loadComponent: () =>
      import('./pages/game-detail/game-detail.component').then((m) => m.GameDetailComponent),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./pages/stats/stats.component').then((m) => m.StatsComponent),
  },
  {
    path: 'playstation',
    loadComponent: () =>
      import('./pages/playstation/playstation.component').then((m) => m.PlaystationComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
