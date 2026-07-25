import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'stock-analysis',
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
  },
  {
    path: 'stock-analysis',
    title: 'Stock Analysis',
    loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
    loadChildren: () =>
      import('./features/stock-analysis/stock-analysis.routes').then(m => m.STOCK_ANALYSIS_ROUTES),
  },
  { path: '**', redirectTo: 'stock-analysis' },
];
