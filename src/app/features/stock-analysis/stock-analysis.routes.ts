import { Routes } from '@angular/router';

export const STOCK_ANALYSIS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./stock-analysis-home').then(m => m.StockAnalysisHome),
  },
];
