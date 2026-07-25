import { UtilizationTabId } from './utilization.model';

/** Timeline comparison mode for utilization dashboards. */
export type UtilizationTimeline = 'qr' | 'mom';

export const DEFAULT_UTILIZATION_TIMELINE: UtilizationTimeline = 'qr';

/** Keys for utilization filter dropdowns. */
export type UtilizationFilterKey =
  | 'ccdYear'
  | 'crrMarket'
  | 'state'
  | 'quarter'
  | 'client';

export interface UtilizationFilterOption {
  label: string;
  value: string;
}

export interface UtilizationFilterDefinition {
  key: UtilizationFilterKey;
  label: string;
  options: UtilizationFilterOption[];
  /** When true, the dropdown stays disabled until options are loaded. */
  disabledWithoutOptions?: boolean;
  /** When true, the dropdown stays disabled until CCD Year is selected. */
  requiresCcdYear?: boolean;
}

export interface UtilizationFilterValues {
  ccdYear: string | null;
  crrMarket: string | null;
  state: string | null;
  quarter: string | null;
  client: string | null;
}

const CURRENT_YEAR = new Date().getFullYear();

export const UTILIZATION_CCD_YEAR_OPTIONS: UtilizationFilterOption[] = Array.from(
  { length: 5 },
  (_, index) => {
    const year = String(CURRENT_YEAR - 2 + index);
    return { label: year, value: year };
  },
);

const DEFAULT_CCD_YEAR =
  UTILIZATION_CCD_YEAR_OPTIONS.find(option => option.value === String(CURRENT_YEAR))?.value ??
  UTILIZATION_CCD_YEAR_OPTIONS.at(-1)?.value ??
  String(CURRENT_YEAR);

const CCD_YEAR_FILTER: UtilizationFilterDefinition = {
  key: 'ccdYear',
  label: 'CCD Year',
  options: UTILIZATION_CCD_YEAR_OPTIONS,
};

const CRR_MARKET_FILTER: UtilizationFilterDefinition = {
  key: 'crrMarket',
  label: 'CRR Market',
  options: [],
  disabledWithoutOptions: true,
};

const STATE_FILTER: UtilizationFilterDefinition = {
  key: 'state',
  label: 'State',
  options: [],
  disabledWithoutOptions: true,
};

const QUARTER_FILTER: UtilizationFilterDefinition = {
  key: 'quarter',
  label: 'Quarter',
  options: [],
  requiresCcdYear: true,
};

const CLIENT_FILTER: UtilizationFilterDefinition = {
  key: 'client',
  label: 'Client',
  options: [],
  requiresCcdYear: true,
};

const MARKET_TAB_FILTERS: UtilizationFilterDefinition[] = [
  CCD_YEAR_FILTER,
  CRR_MARKET_FILTER,
  STATE_FILTER,
];

const DRILLDOWN_TAB_FILTERS: UtilizationFilterDefinition[] = [
  CCD_YEAR_FILTER,
  QUARTER_FILTER,
  CLIENT_FILTER,
];

export function getUtilizationFiltersForTab(tabId: UtilizationTabId): UtilizationFilterDefinition[] {
  if (tabId === 'client-level-drilldown') {
    return DRILLDOWN_TAB_FILTERS;
  }
  return MARKET_TAB_FILTERS;
}

export function createDefaultUtilizationFilterValues(): UtilizationFilterValues {
  return {
    ccdYear: DEFAULT_CCD_YEAR,
    crrMarket: null,
    state: null,
    quarter: null,
    client: null,
  };
}

export function isUtilizationFilterDisabled(
  filter: UtilizationFilterDefinition,
  values: UtilizationFilterValues,
): boolean {
  if (filter.disabledWithoutOptions && filter.options.length === 0) {
    return true;
  }
  if (filter.requiresCcdYear && !values.ccdYear) {
    return true;
  }
  return false;
}
