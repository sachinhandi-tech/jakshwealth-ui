/** Timeline comparison mode for proof point charts. */
export type ProofPointTimeline = 'ytd' | 'yoy';

export const PROOF_POINT_TIMELINE_OPTIONS: readonly {
  label: string;
  value: ProofPointTimeline;
}[] = [
  { label: 'YTD', value: 'ytd' },
  { label: 'YoY', value: 'yoy' },
];

export const DEFAULT_PROOF_POINT_TIMELINE: ProofPointTimeline = 'ytd';

/** Keys for the shared proof point filter dropdowns. */
export type ProofPointFilterKey =
  | 'crrMarket'
  | 'providerNetwork'
  | 'specialtyCategory'
  | 'specialtyType'
  | 'episodeCategory'
  | 'memberProduct';

export interface ProofPointFilterOption {
  label: string;
  value: string;
}

/** Filter definition; `multiSelect` can be set to false per filter when requirements change. */
export interface ProofPointFilterDefinition {
  key: ProofPointFilterKey;
  label: string;
  multiSelect: boolean;
  options: ProofPointFilterOption[];
}

export const PROOF_POINT_FILTERS: ProofPointFilterDefinition[] = [
  {
    key: 'crrMarket',
    label: 'CRR Market',
    multiSelect: true,
    options: [],
  },
  {
    key: 'providerNetwork',
    label: 'Provider Network',
    multiSelect: true,
    options: [],
  },
  {
    key: 'specialtyCategory',
    label: 'Specialty Category',
    multiSelect: true,
    options: [],
  },
  {
    key: 'specialtyType',
    label: 'Specialty Type',
    multiSelect: true,
    options: [],
  },
  {
    key: 'episodeCategory',
    label: 'Episode Category',
    multiSelect: true,
    options: [],
  },
  {
    key: 'memberProduct',
    label: 'Member Product',
    multiSelect: true,
    options: [],
  },
];

export type ProofPointFilterValues = Record<ProofPointFilterKey, string[]>;

export function createEmptyProofPointFilterValues(): ProofPointFilterValues {
  return {
    crrMarket: [],
    providerNetwork: [],
    specialtyCategory: [],
    specialtyType: [],
    episodeCategory: [],
    memberProduct: [],
  };
}
