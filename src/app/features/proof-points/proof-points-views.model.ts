import { ProofPointViewItem } from './proof-points.model';

/** Shared proof point view menu (CCD and Tier 1). */
export const PROOF_POINT_VIEWS: ProofPointViewItem[] = [
  { id: 'volume', label: 'Volume', icon: 'stacked_bar_chart' },
  { id: 'spend', label: 'Spend', icon: 'payments' },
  { id: 'utilization', label: 'Utilization', icon: 'donut_large' },
  { id: 'savings', label: 'Savings', icon: 'savings' },
  { id: 'quality', label: 'Quality', icon: 'verified' },
  { id: 'turnover-disruption', label: 'Turnover & Disruption', icon: 'sync_problem' },
];
