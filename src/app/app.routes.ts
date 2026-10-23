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
  {
    path: 'settings',
    children: [
      {
        path: 'subscription',
        title: 'Subscription Settings',
        canActivate: [kiteAuthGuard],
        loadComponent: () =>
          import('./features/kite-desk/saas-subscription').then(m => m.SaasSubscription),
      },
    ],
  },
  {
    path: 'admin',
    children: [
      {
        path: 'users',
        title: 'Manage Team Members',
        canActivate: [kiteAuthGuard],
        loadComponent: () =>
          import('./features/kite-desk/saas-admin-users').then(m => m.SaasAdminUsers),
      },
      {
        path: 'billing',
        title: 'Billing & Invoices',
        canActivate: [kiteAuthGuard],
        loadComponent: () =>
          import('./features/kite-desk/saas-admin-billing').then(m => m.SaasAdminBilling),
      },
    ],
  },
  { path: '**', redirectTo: 'kite/dashboard' },
];
