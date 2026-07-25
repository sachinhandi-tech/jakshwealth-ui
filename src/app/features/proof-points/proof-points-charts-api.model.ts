import { ProofPointFilterValues, ProofPointTimeline } from './proof-points-filters.model';
import { ProofPointDashboard, ProofPointDesignation } from './proof-points.model';

export type ProofPointChartType = 'bar' | 'doughnut';

/** Chart payload returned by the proof points charts API. */
export interface ProofPointChartApiPayload {
  chartId: string;
  chartType: ProofPointChartType;
  labels: string[];
  data: number[] | number[][];
  /** Doughnut card title (API). */
  title?: string;
  /** Doughnut subtitle / explanation (API). */
  explanation?: string;
  /** Doughnut center ring lines, top to bottom (API). */
  centerLines?: string[];
  /** Per-slice hover text; use `\n` between tooltip lines (API). */
  hoverMessages?: string[];
}

/** ngui-charts sizing props from charts.config.json `presentation`. */
export interface ChartPresentationConfig {
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
}

/** Render-ready chart card for ngui-charts. */
export interface ProofPointChartConfig {
  chartId: string;
  title: string;
  subtitle?: string;
  type: ProofPointChartType;
  data: Record<string, unknown>;
  options: Record<string, unknown>;
  ariaLabel: string;
  layout?: 'default' | 'doughnut-header';
  presentation?: ChartPresentationConfig;
  plugins?: Record<string, unknown>[];
}

export interface ProofPointsChartsRequest {
  dashboard: ProofPointDashboard;
  designation: ProofPointDesignation;
  viewId: string;
  timeline: ProofPointTimeline;
  filters: ProofPointFilterValues;
}

export interface ProofPointsChartsApiResponse {
  charts: ProofPointChartApiPayload[];
}

export interface ProofPointsChartsResponse {
  charts: ProofPointChartConfig[];
}

export interface ChartSchemeConfig {
  id: string;
  legend_colors: string[];
  dataSetDefaults?: Record<string, unknown>;
  chartOptions?: Record<string, unknown>;
  presentation?: ChartPresentationConfig;
}

export interface ChartBindingMatch {
  chartId?: string;
  suffix?: string;
  chartType?: ProofPointChartType;
}

/** Bar charts only — doughnut copy and center text come from the API. */
export interface ChartBindingConfig {
  match: ChartBindingMatch;
  schemeId?: string;
  titleTemplate?: string;
  seriesLabelTemplates?: string[];
  layout?: 'default';
}

export interface ChartsConfigFile {
  defaults: Partial<Record<ProofPointChartType, string>>;
  schemes: Partial<Record<ProofPointChartType, ChartSchemeConfig[]>>;
  chartBindings: ChartBindingConfig[];
}

export interface ChartTemplateContext {
  designationLabel: string;
  viewLabel: string;
  timelineLabel: string;
  metric: string;
  comparison: string;
}
