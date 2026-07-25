import { Routes } from '@angular/router';

import { DEFAULT_PROOF_POINTS_TAB } from './proof-points.model';

export const PROOF_POINTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./proof-points-home').then(m => m.ProofPointsHome),
    children: [
      { path: '', redirectTo: DEFAULT_PROOF_POINTS_TAB, pathMatch: 'full' },
      {
        path: 'ccd',
        title: 'CCD Proof Points',
        loadComponent: () => import('./ccd/ccd-proof-points').then(m => m.CcdProofPoints),
      },
      {
        path: 'tier-1',
        title: 'Tier 1 Proof Points',
        loadComponent: () => import('./tier-1/tier-1-proof-points').then(m => m.Tier1ProofPoints),
      },
    ],
  },
];
