import {
  ChartBindingConfig,
  ChartSchemeConfig,
  ChartTemplateContext,
  ChartsConfigFile,
  ProofPointChartApiPayload,
  ProofPointChartConfig,
  ProofPointChartType,
  ProofPointsChartsRequest,
} from '../proof-points-charts-api.model';
import { proofPointDoughnutCenterPlugin } from './proof-point-doughnut-center.plugin';

const DOUGHNUT_CHART_PLUGINS = [proofPointDoughnutCenterPlugin] as Record<string, unknown>[];

const VIEW_META: Record<string, { label: string; metric: string; comparison: string }> = {
  volume: { label: 'Volume', metric: 'Claim volume', comparison: 'Prior period volume' },
  spend: { label: 'Spend', metric: 'Spend (000s)', comparison: 'Budget (000s)' },
  utilization: { label: 'Utilization', metric: 'Utilization rate (%)', comparison: 'Target rate (%)' },
  savings: { label: 'Savings', metric: 'Realized savings (000s)', comparison: 'Goal (000s)' },
  quality: { label: 'Quality', metric: 'Quality score', comparison: 'Benchmark score' },
  'turnover-disruption': {
    label: 'Turnover & Disruption',
    metric: 'Disruption rate (%)',
    comparison: 'Peer median (%)',
  },
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function interpolateTemplate(template: string | undefined, context: ChartTemplateContext): string {
  if (!template) {
    return '';
  }

  return template.replace(/\{(\w+)\}/g, (_, key: keyof ChartTemplateContext) => context[key] ?? '');
}

function flattenSeriesData(data: number[] | number[][]): number[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return Array.isArray(data[0]) ? (data as number[][]).flat() : (data as number[]);
}

function getScheme(config: ChartsConfigFile, chartType: ProofPointChartType): ChartSchemeConfig {
  const schemes = config.schemes[chartType] ?? [];
  const defaultId = config.defaults[chartType];
  const match = defaultId ? schemes.find(scheme => scheme.id === defaultId) : schemes[0];

  return (
    match ?? {
      id: `${chartType}_default`,
      legend_colors: ['var(--dataviz-qualitative-100)'],
    }
  );
}

function matchesBinding(binding: ChartBindingConfig, payload: ProofPointChartApiPayload): boolean {
  const { match } = binding;
  if (match.chartId && match.chartId !== payload.chartId) {
    return false;
  }
  if (match.suffix && !payload.chartId.endsWith(match.suffix)) {
    return false;
  }
  if (match.chartType && match.chartType !== payload.chartType) {
    return false;
  }
  return true;
}

function resolveBarBinding(
  config: ChartsConfigFile,
  payload: ProofPointChartApiPayload,
): ChartBindingConfig {
  const binding = config.chartBindings.find(entry => matchesBinding(entry, payload));
  return (
    binding ?? {
      match: { chartType: 'bar' },
      schemeId: config.defaults.bar,
    }
  );
}

function parseTooltipTwoLines(message: string): [string, string] {
  const newlineIndex = message.indexOf('\n');
  if (newlineIndex === -1) {
    return [message.trim(), ''];
  }

  return [message.slice(0, newlineIndex).trim(), message.slice(newlineIndex + 1).trim()];
}

function buildDoughnutTooltipLines(hoverMessages: string[] | undefined, sliceCount: number) {
  if (!hoverMessages?.length) {
    return undefined;
  }

  const line1: string[] = [];
  const line2: string[] = [];

  for (let index = 0; index < sliceCount; index += 1) {
    const [first, second] = parseTooltipTwoLines(hoverMessages[index] ?? '');
    line1.push(first);
    line2.push(second);
  }

  return { line1, line2 };
}

/** Single doughnut build pattern (Provider Group Volume reference). Copy from API; style from config. */
function buildDoughnutChart(
  payload: ProofPointChartApiPayload,
  scheme: ChartSchemeConfig,
): ProofPointChartConfig {
  const values = flattenSeriesData(payload.data);
  const defaults = cloneJson(scheme.dataSetDefaults ?? {}) as Record<string, unknown>;
  const borderColor = (defaults['borderColor'] as string | undefined) ?? '#ffffff';
  const tooltipLines = buildDoughnutTooltipLines(payload.hoverMessages, values.length);
  const centerLines = (payload.centerLines ?? []).map(text => ({ text: text.trim() })).filter(line => line.text);
  const title = payload.title?.trim() || payload.chartId;
  const subtitle = payload.explanation?.trim() || undefined;
  const centerSummary = centerLines.map(line => line.text).join(' ');

  const options = cloneJson(scheme.chartOptions ?? {}) as Record<string, unknown>;
  const plugins = (options['plugins'] ??= {}) as Record<string, unknown>;
  const centerPlugin = (plugins['proofPointDoughnutCenter'] ??= {}) as Record<string, unknown>;
  centerPlugin['lines'] = centerLines;

  return {
    chartId: payload.chartId,
    title,
    subtitle,
    type: 'doughnut',
    data: {
      labels: payload.labels,
      datasets: [
        {
          ...defaults,
          data: values,
          backgroundColor: scheme.legend_colors.slice(0, values.length),
          borderColor: values.map(() => borderColor),
          ...(tooltipLines
            ? {
                proofPointTooltipLine1: tooltipLines.line1,
                proofPointTooltipLine2: tooltipLines.line2,
              }
            : {}),
        },
      ],
    },
    options,
    ariaLabel: subtitle ? `${title}. ${subtitle}. ${centerSummary}` : `${title}. ${centerSummary}`,
    layout: 'doughnut-header',
    presentation: scheme.presentation ? cloneJson(scheme.presentation) : undefined,
    plugins: DOUGHNUT_CHART_PLUGINS,
  };
}

function buildBarChart(
  payload: ProofPointChartApiPayload,
  scheme: ChartSchemeConfig,
  binding: ChartBindingConfig,
  context: ChartTemplateContext,
): ProofPointChartConfig {
  const values = Array.isArray(payload.data[0])
    ? (payload.data as number[][])
    : [payload.data as number[]];
  const seriesLabels = (binding.seriesLabelTemplates ?? []).map(label =>
    interpolateTemplate(label, context),
  );
  const title = interpolateTemplate(binding.titleTemplate, context) || payload.chartId;

  return {
    chartId: payload.chartId,
    title,
    type: 'bar',
    data: {
      labels: payload.labels,
      datasets: values.map((series, index) => ({
        label: seriesLabels[index] ?? `Series ${index + 1}`,
        backgroundColor: scheme.legend_colors[index % scheme.legend_colors.length],
        data: series,
      })),
    },
    options: cloneJson(scheme.chartOptions ?? {}),
    ariaLabel: `${title} chart`,
    layout: 'default',
    presentation: scheme.presentation ? cloneJson(scheme.presentation) : undefined,
  };
}

function buildBarTemplateContext(request: ProofPointsChartsRequest): ChartTemplateContext {
  const meta = VIEW_META[request.viewId] ?? {
    label: request.viewId.replace(/-/g, ' ').replace(/_/g, ' '),
    metric: 'Current period',
    comparison: 'Comparison period',
  };

  return {
    designationLabel: request.designation === 'ccd' ? 'CCD' : 'Tier 1',
    viewLabel: meta.label,
    timelineLabel: request.timeline === 'yoy' ? 'YoY' : 'YTD',
    metric: meta.metric,
    comparison: meta.comparison,
  };
}

export function buildChartFromApiPayload(
  payload: ProofPointChartApiPayload,
  config: ChartsConfigFile,
  context: ChartTemplateContext,
): ProofPointChartConfig {
  if (payload.chartType === 'doughnut') {
    return buildDoughnutChart(payload, getScheme(config, 'doughnut'));
  }

  const binding = resolveBarBinding(config, payload);
  const scheme = getScheme(config, 'bar');
  return buildBarChart(payload, scheme, binding, context);
}

export function buildProofPointCharts(
  payloads: ProofPointChartApiPayload[],
  config: ChartsConfigFile,
  request: ProofPointsChartsRequest,
): ProofPointChartConfig[] {
  const context = buildBarTemplateContext(request);
  return payloads.map(payload => buildChartFromApiPayload(payload, config, context));
}
