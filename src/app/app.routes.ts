import { Routes } from '@angular/router';

import { kiteAuthGuard } from './features/kite-desk/kite.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'kite/dashboard' },
  {
    path: 'kite',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'login',
        title: 'Kite login',
        loadComponent: () => import('./features/kite-desk/kite-login').then(m => m.KiteLogin),
      },
      {
        path: 'dashboard',
        title: 'Kite dashboard',
        canActivate: [kiteAuthGuard],
        loadComponent: () =>
          import('./features/kite-desk/kite-dashboard').then(m => m.KiteDashboard),
      },
    ],
  },
  { path: '**', redirectTo: 'kite/dashboard' },
];
