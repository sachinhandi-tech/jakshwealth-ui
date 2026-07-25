/** Left-nav entry for a proof point view (charts load for the active item). */
export interface ProofPointViewItem {
  id: string;
  label: string;
  icon?: string;
}

/** Tab definitions for the Proof Points dashboard (synced to child routes). */
export interface ProofPointsTab {
  label: string;
  path: string;
}

export const PROOF_POINTS_TABS: ProofPointsTab[] = [
  { label: 'CCD', path: 'ccd' },
  { label: 'Tier 1', path: 'tier-1' },
];

export const DEFAULT_PROOF_POINTS_TAB = PROOF_POINTS_TABS[0].path;

/** Proof point dashboard designation passed to chart APIs. */
export type ProofPointDesignation = 'ccd' | 'tier-1';

/** Dashboard identifier sent to fetch-charts. */
export type ProofPointDashboard = 'proof-points';

export const PROOF_POINTS_DASHBOARD: ProofPointDashboard = 'proof-points';

/** Expanded width for views and filters side panels. */
export const PROOF_POINTS_SIDEBAR_WIDTH = '240px';

/** Collapsed strip width on narrow viewports. */
export const PROOF_POINTS_COLLAPSED_STRIP_WIDTH = '20px';

/** Viewport width below 1490px at which the views panel collapses to a strip. */
export const PROOF_POINTS_VIEWS_COLLAPSE_BREAKPOINT_PX = 1489;

/** Viewport width below 1270px at which the filters panel collapses to a strip. */
export const PROOF_POINTS_FILTERS_COLLAPSE_BREAKPOINT_PX = 1269;

/** Viewport width at or below which side panels use narrow overlay positioning. */
export const PROOF_POINTS_NARROW_BREAKPOINT_PX = 600;
