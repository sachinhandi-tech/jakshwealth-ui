/** Tab definitions for the Utilization dashboard (synced to child routes). */
export interface UtilizationTab {
  label: string;
  path: string;
}

export const UTILIZATION_TABS: UtilizationTab[] = [
  { label: 'Tiered Plan Highlights', path: 'tiered-plan-highlights' },
  { label: 'Tiered Utilization Trend', path: 'tiered-utilization-trend' },
  { label: 'Client Level Drilldown', path: 'client-level-drilldown' },
];

export const DEFAULT_UTILIZATION_TAB = UTILIZATION_TABS[0].path;

export type UtilizationTabId = (typeof UTILIZATION_TABS)[number]['path'];

/** Expanded width for the filters side panel. */
export const UTILIZATION_FILTERS_WIDTH = '240px';

/** Collapsed strip width on narrow viewports. */
export const UTILIZATION_COLLAPSED_STRIP_WIDTH = '20px';

/** Viewport width below which the filters panel collapses to a strip. */
export const UTILIZATION_FILTERS_COLLAPSE_BREAKPOINT_PX = 1269;

/** Viewport width at or below which the filters panel uses narrow overlay positioning. */
export const UTILIZATION_NARROW_BREAKPOINT_PX = 600;
