/** Supported custom funnel chart type (not an ngui-charts / Chart.js type). */
export type FunnelChartType = 'funnel';

/**
 * Single funnel chart payload returned by the utilization charts API.
 * Mirrors the proof-points doughnut shape (`labels`, `data`, `hoverMessages`, …)
 * with `chartType: "funnel"` and no doughnut-only fields (`centerLines`).
 */
export interface FunnelChartApiPayload {
  chartId: string;
  chartType: FunnelChartType;
  /** Card heading. */
  title: string;
  /** Card subtitle / explanation. */
  explanation?: string;
  /** One label per funnel tier, left to right. */
  labels: string[];
  /** One numeric value per tier; same order as `labels`. */
  data: number[] | number[][];
  /**
   * Per-tier hover text. Use `\n` between the tooltip title and body line(s),
   * matching the proof-points doughnut `hoverMessages` convention.
   */
  hoverMessages?: string[];
  /** Optional per-tier colors; defaults to {@link DEFAULT_FUNNEL_TIER_COLORS}. */
  colors?: string[];
}

/** Utilization dashboard charts API envelope (one or more funnel charts). */
export interface UtilizationChartsApiResponse {
  charts: FunnelChartApiPayload[];
}

/** A single tier in the rendered horizontal funnel chart. */
export interface FunnelTier {
  label: string;
  value: number;
  color: string;
  tooltip?: FunnelTierTooltip;
}

/** Tooltip content shown when hovering a funnel tier. */
export interface FunnelTierTooltip {
  title?: string;
  lines?: string[];
}

/** View-model consumed by the funnel chart template and SVG geometry. */
export interface FunnelChartViewModel {
  chartId: string;
  title: string;
  subtitle?: string;
  ariaLabel: string;
  tiers: FunnelTier[];
}

/** Computed geometry for rendering one funnel segment in SVG. */
export interface FunnelSegmentGeometry {
  index: number;
  blockPath: string;
  connectorPath: string | null;
  centerX: number;
  centerY: number;
}

/** Default tier colors when the API omits `colors`. */
export const DEFAULT_FUNNEL_TIER_COLORS = [
  '#0d0da1',
  '#3879db',
  '#002f32',
  '#1a9baa',
] as const;

function flattenSeriesData(data: number[] | number[][]): number[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return Array.isArray(data[0]) ? (data as number[][]).flat() : (data as number[]);
}

function parseHoverMessage(message: string | undefined): FunnelTierTooltip | undefined {
  if (!message?.trim()) {
    return undefined;
  }

  const newlineIndex = message.indexOf('\n');
  if (newlineIndex === -1) {
    return { title: message.trim() };
  }

  const title = message.slice(0, newlineIndex).trim();
  const body = message.slice(newlineIndex + 1).trim();

  return {
    title: title || undefined,
    lines: body ? [body] : undefined,
  };
}

function defaultTooltip(label: string, value: number): FunnelTierTooltip {
  return {
    title: label,
    lines: [new Intl.NumberFormat('en-US').format(value)],
  };
}

/** Maps an API chart payload into the internal funnel view-model. */
export function buildFunnelChartViewModel(payload: FunnelChartApiPayload): FunnelChartViewModel {
  const values = flattenSeriesData(payload.data);
  const tierCount = Math.min(payload.labels.length, values.length);

  const tiers: FunnelTier[] = Array.from({ length: tierCount }, (_, index) => {
    const label = payload.labels[index];
    const value = values[index];

    return {
      label,
      value,
      color:
        payload.colors?.[index] ??
        DEFAULT_FUNNEL_TIER_COLORS[index % DEFAULT_FUNNEL_TIER_COLORS.length],
      tooltip: parseHoverMessage(payload.hoverMessages?.[index]) ?? defaultTooltip(label, value),
    };
  });

  return {
    chartId: payload.chartId,
    title: payload.title,
    subtitle: payload.explanation,
    ariaLabel: payload.title,
    tiers,
  };
}

/** Sample API chart for Tiered Plan Highlights (local dev / placeholder). */
export const TIERED_MEMBERSHIP_FUNNEL_CHART: FunnelChartApiPayload = {
  chartId: 'tiered-membership',
  chartType: 'funnel',
  title: 'Tiered Membership',
  explanation: 'Chart explanation goes here',
  labels: [
    'Cigna Members',
    'Active Tiered Benefits',
    'Tier Eligible Claims',
    'Tier 1 Provider Claims',
  ],
  data: [1_000_000, 750_000, 500_000, 250_000],
  hoverMessages: [
    'Cigna Members\n1,000,000 total members',
    'Active Tiered Benefits\n750,000 members with active tiered benefits',
    'Tier Eligible Claims\n500,000 tier-eligible claims',
    'Tier 1 Provider Claims\n250,000 tier 1 provider claims',
  ],
};
