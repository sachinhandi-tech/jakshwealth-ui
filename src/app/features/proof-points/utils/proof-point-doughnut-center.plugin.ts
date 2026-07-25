import type { Chart, TooltipItem } from 'chart.js';

export interface ProofPointDoughnutCenterLine {
  text: string;
  font?: string;
  color?: string;
}

export interface ProofPointDoughnutCenterOptions {
  lines?: ProofPointDoughnutCenterLine[];
  valueFont?: string;
  labelFont?: string;
  valueColor?: string;
  labelColor?: string;
  lineGap?: number;
}

interface DoughnutDatasetWithTooltip {
  proofPointTooltipLine1?: string[];
  proofPointTooltipLine2?: string[];
}

function lineHeightFromFont(font: string): number {
  const lineHeightMatch = font.match(/\/(\d+)px/);
  if (lineHeightMatch) {
    return Number.parseInt(lineHeightMatch[1], 10) || 16;
  }

  const fontSizeMatch = font.match(/\d+px/);
  return Number.parseInt(fontSizeMatch?.[0] ?? '16', 10) || 16;
}

const configuredTooltipCharts = new WeakSet<Chart>();

function isDoughnutChart(chart: Chart): boolean {
  const chartType = (chart.config as { type?: string }).type;
  return chartType === 'doughnut' || chartType === 'pie';
}

/** Wires pre-built tooltip lines into the native Chart.js tooltip (NGUI JSON-clones options). */
function configureDoughnutTooltip(chart: Chart): void {
  if (configuredTooltipCharts.has(chart) || !isDoughnutChart(chart)) {
    return;
  }

  const dataset = chart.data.datasets?.[0] as DoughnutDatasetWithTooltip | undefined;
  if (!dataset?.proofPointTooltipLine1?.length && !dataset?.proofPointTooltipLine2?.length) {
    return;
  }

  const tooltip = chart.options.plugins?.tooltip;
  if (!tooltip) {
    return;
  }

  configuredTooltipCharts.add(chart);
  tooltip.callbacks ??= {};
  tooltip.callbacks.title = () => '';
  const labelCallback = (tooltipItem: TooltipItem<'doughnut'>) => {
    const line1 = dataset.proofPointTooltipLine1?.[tooltipItem.dataIndex]?.trim() ?? '';
    const line2 = dataset.proofPointTooltipLine2?.[tooltipItem.dataIndex]?.trim() ?? '';
    if (line1 && line2) {
      return [line1, line2];
    }
    return line1 || line2;
  };
  tooltip.callbacks.label = labelCallback as typeof tooltip.callbacks.label;
}

/** Draws multi-line center text from options.plugins.proofPointDoughnutCenter in charts.config.json. */
export const proofPointDoughnutCenterPlugin = {
  id: 'proofPointDoughnutCenter',
  afterInit(chart: Chart) {
    configureDoughnutTooltip(chart);
  },
  afterDraw(chart: Chart) {
    const plugins = chart.options?.plugins as Record<string, unknown> | undefined;
    const opts = plugins?.['proofPointDoughnutCenter'] as ProofPointDoughnutCenterOptions | undefined;
    const chartType = (chart as { config?: { type?: string } }).config?.type;
    if (!opts || (chartType !== 'doughnut' && chartType !== 'pie')) {
      return;
    }

    const lines = (opts.lines ?? [])
      .filter(line => line.text.trim().length > 0)
      .map((line, index, allLines) => ({
        text: line.text,
        font:
          line.font ??
          (index === allLines.length - 1 ? opts.labelFont : opts.valueFont) ??
          opts.valueFont,
        color:
          line.color ??
          (index === allLines.length - 1 ? opts.labelColor : opts.valueColor) ??
          opts.valueColor,
      }))
      .filter(line => line.font && line.color);

    if (!lines.length) {
      return;
    }

    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) {
      return;
    }

    const centerX = chartArea.left + (chartArea.right - chartArea.left) / 2;
    const centerY = chartArea.top + (chartArea.bottom - chartArea.top) / 2;
    const lineGap = opts.lineGap ?? 0;
    const valueFont = lines[0].font!;
    const totalHeight = lines.reduce(
      (acc, line, index) => acc + lineHeightFromFont(line.font!) + (index ? lineGap : 0),
      0,
    );

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let y = centerY - totalHeight / 2 + lineHeightFromFont(valueFont) / 2;

    lines.forEach((line, index) => {
      ctx.font = line.font!;
      ctx.fillStyle = line.color!;
      ctx.fillText(line.text, centerX, y);

      if (index < lines.length - 1) {
        const nextFont = lines[index + 1].font!;
        y += lineHeightFromFont(line.font!) / 2 + lineGap + lineHeightFromFont(nextFont) / 2;
      }
    });

    ctx.restore();
  },
};
