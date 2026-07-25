import { Routes } from '@angular/router';

import { authGuard, loggedInGuard } from './guards/auth.guard';
import { aiChatGuard } from './guards/feature.guard';

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
    title: 'Logout',
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
  {
    path: 'utilization',
    title: 'CCD and Tiered Utilization',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
    loadChildren: () =>
      import('./features/utilization/utilization.routes').then(m => m.UTILIZATION_ROUTES),
  },
  {
    path: 'proof-points',
    title: 'Proof Points dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
    loadChildren: () =>
      import('./features/proof-points/proof-points.routes').then(m => m.PROOF_POINTS_ROUTES),
  },
  {
    path: 'admin',
    title: 'Admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'ai-chat',
    title: 'AI Analytics Chat',
    canActivate: [authGuard, aiChatGuard],
    loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
    loadChildren: () => import('./features/ai-chat/ai-chat.routes').then(m => m.AI_CHAT_ROUTES),
  },
  { path: '**', redirectTo: 'about' },
];
