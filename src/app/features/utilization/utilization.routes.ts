import { Routes } from '@angular/router';

import { DEFAULT_UTILIZATION_TAB } from './utilization.model';

export const UTILIZATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./utilization-home').then(m => m.UtilizationHome),
    children: [
      { path: '', redirectTo: DEFAULT_UTILIZATION_TAB, pathMatch: 'full' },
      {
        path: 'tiered-plan-highlights',
        title: 'Tiered Plan Highlights',
        loadComponent: () =>
          import('./tiered-plan-highlights/tiered-plan-highlights').then(m => m.TieredPlanHighlights),
      },
      {
        path: 'tiered-utilization-trend',
        title: 'Tiered Utilization Trend',
        loadComponent: () =>
          import('./tiered-utilization-trend/tiered-utilization-trend').then(
            m => m.TieredUtilizationTrend,
          ),
      },
      {
        path: 'client-level-drilldown',
        title: 'Client Level Drilldown',
        loadComponent: () =>
          import('./client-level-drilldown/client-level-drilldown').then(m => m.ClientLevelDrilldown),
      },
    ],
  },
];
