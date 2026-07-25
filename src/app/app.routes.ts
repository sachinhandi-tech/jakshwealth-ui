import { Routes } from '@angular/router';

import { authGuard, loggedInGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'about',
  },
  {
    path: 'about',
    title: 'About',
    loadComponent: () => import('./components/about/about').then(m => m.About),
  },
  {
    path: 'home',
    title: 'Home',
    loadComponent: () => import('./components/landing/landing').then(m => m.Landing),
    canActivate: [authGuard],
  },
  {
    path: 'unauthorised',
    title: 'Unauthorised',
    loadComponent: () => import('./components/unauthorised/unauthorised').then(m => m.Unauthorised),
    canActivate: [loggedInGuard],
  },
  {
    path: 'authorize',
    title: 'Sign in',
    loadComponent: () => import('./components/authorize/authorize').then(m => m.Authorize),
  },
  {
    path: 'logout',
    title: 'Sign in',
    loadComponent: () => import('./components/authorize/authorize').then(m => m.Authorize),
  },
  {
    path: 'stock-analysis',
    title: 'Stock Analysis',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
    loadChildren: () =>
      import('./features/stock-analysis/stock-analysis.routes').then(m => m.STOCK_ANALYSIS_ROUTES),
  },
  { path: '**', redirectTo: 'about' },
];
