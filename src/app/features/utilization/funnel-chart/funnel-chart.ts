import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

import { CardModule } from '@cigna/cigna_dae_ngui_library/lib/card';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import {
  buildFunnelChartViewModel,
  FunnelChartApiPayload,
  FunnelSegmentGeometry,
  FunnelTier,
  FunnelTierTooltip,
} from './funnel-chart.model';

/**
 * Custom horizontal funnel chart for utilization dashboards.
 *
 * Accepts a single API chart object (same envelope as proof-points doughnut charts,
 * with `chartType: "funnel"`). Rendering is SVG-based; this is not an ngui-charts type.
 *
 * @example Expected utilization charts API response
 * ```json
 * {
 *   "charts": [
 *     {
 *       "chartId": "tiered-membership",
 *       "chartType": "funnel",
 *       "title": "Tiered Membership",
 *       "explanation": "Chart explanation goes here",
 *       "labels": [
 *         "Cigna Members",
 *         "Active Tiered Benefits",
 *         "Tier Eligible Claims",
 *         "Tier 1 Provider Claims"
 *       ],
 *       "data": [
 *         1000000,
 *         750000,
 *         500000,
 *         250000
 *       ],
 *       "hoverMessages": [
 *         "Cigna Members\n1,000,000 total members",
 *         "Active Tiered Benefits\n750,000 members with active tiered benefits",
 *         "Tier Eligible Claims\n500,000 tier-eligible claims",
 *         "Tier 1 Provider Claims\n250,000 tier 1 provider claims"
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Parent usage (one chart from the response)
 * ```html
 * <app-funnel-chart [chart]="chartsResponse.charts[0]" />
 * ```
 *
 * Field mapping:
 * - `title` → card heading
 * - `explanation` → card subtitle
 * - `labels[]` + `data[]` → funnel tiers left-to-right (width aligned to legend columns)
 * - `hoverMessages[]` → per-tier tooltip (`\n` separates title and body line)
 * - optional `colors[]` → tier fill colors; omitted tiers use the default palette
 */
const VIEWBOX_WIDTH = 1000;
const CHART_PADDING_X = 8;
const CONNECTOR_WIDTH = 18;
const BASE_TIER_HEIGHT = 90;
const VERTICAL_TAPER = 0.38;
const FIRST_TIER_HEIGHT = BASE_TIER_HEIGHT * 1.5;
const LAST_TIER_HEIGHT = BASE_TIER_HEIGHT * (1 - VERTICAL_TAPER) * 0.5;
const TOP_BASE = 40;
const TOP_PADDING = 4;
const BOTTOM_PADDING = 12;
const CORNER_RADIUS = 6;
const END_CAP_RADIUS = 12;

/** Legend-column bounds mapped into SVG coordinates. */
interface TierColumnLayout {
  x: number;
  width: number;
}

@Component({
  selector: 'app-funnel-chart',
  imports: [CardModule, TypographyModule],
  templateUrl: './funnel-chart.html',
  styleUrl: './funnel-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FunnelChart {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  private metricsRowEl: HTMLElement | null = null;
  private chartWrapEl: HTMLElement | null = null;

  /** API chart payload (`chartType: "funnel"`). */
  readonly chart = input.required<FunnelChartApiPayload>();

  readonly viewModel = computed(() => buildFunnelChartViewModel(this.chart()));

  /** Measured legend-column layout when all tiers fit on one row. */
  private readonly tierColumnLayout = signal<TierColumnLayout[] | null>(null);

  readonly viewBox = computed(() => {
    const minY = TOP_BASE - TOP_PADDING;
    const height = FIRST_TIER_HEIGHT + TOP_PADDING + BOTTOM_PADDING;
    return `${CHART_PADDING_X} ${minY} ${VIEWBOX_WIDTH - CHART_PADDING_X * 2} ${height}`;
  });

  readonly activeTierIndex = signal<number | null>(null);
  readonly tooltipX = signal(0);
  readonly tooltipY = signal(0);

  readonly formattedTiers = computed(() =>
    this.viewModel().tiers.map(tier => ({
      ...tier,
      formattedValue: this.formatValue(tier.value),
    })),
  );

  readonly segments = computed(() =>
    this.buildSegmentGeometry(this.viewModel().tiers, this.tierColumnLayout()),
  );

  readonly activeTooltip = computed(() => {
    const index = this.activeTierIndex();
    if (index === null) {
      return null;
    }
    const tier = this.viewModel().tiers[index];
    return this.resolveTooltip(tier);
  });

  onTierEnter(index: number, event: MouseEvent | FocusEvent): void {
    const target = event.currentTarget as SVGGraphicsElement | null;
    const svg = target?.ownerSVGElement;
    const container = svg?.closest('.funnel-chart__chart-wrap') as HTMLElement | null;

    if (!target || !svg || !container) {
      this.activeTierIndex.set(index);
      return;
    }

    const segmentRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const centerX = segmentRect.left + segmentRect.width / 2 - containerRect.left;
    const topY = segmentRect.top - containerRect.top;

    this.tooltipX.set(centerX);
    this.tooltipY.set(topY);
    this.activeTierIndex.set(index);
  }

  onTierLeave(): void {
    this.activeTierIndex.set(null);
  }

  constructor() {
    afterNextRender(() => {
      const host = this.elementRef.nativeElement;
      this.metricsRowEl = host.querySelector('.funnel-chart__metrics');
      this.chartWrapEl = host.querySelector('.funnel-chart__chart-wrap');

      if (!this.metricsRowEl || !this.chartWrapEl) {
        return;
      }

      const observer = new ResizeObserver(() => this.syncTierColumnLayout());
      observer.observe(this.metricsRowEl);
      observer.observe(this.chartWrapEl);
      this.destroyRef.onDestroy(() => observer.disconnect());
      this.syncTierColumnLayout();
    });

    effect(() => {
      void this.viewModel().tiers.length;
      queueMicrotask(() => this.syncTierColumnLayout());
    });
  }

  private syncTierColumnLayout(): void {
    const metricsRow = this.metricsRowEl;
    const chartWrap = this.chartWrapEl;

    if (!metricsRow || !chartWrap) {
      return;
    }

    const metricEls = [...metricsRow.querySelectorAll<HTMLElement>('.funnel-chart__metric')];
    const expectedTierCount = this.viewModel().tiers.length;

    if (metricEls.length !== expectedTierCount || chartWrap.clientWidth === 0) {
      this.tierColumnLayout.set(null);
      return;
    }

    const chartRect = chartWrap.getBoundingClientRect();
    const firstTop = metricEls[0].getBoundingClientRect().top;
    const isSingleRow = metricEls.every(
      metric => Math.abs(metric.getBoundingClientRect().top - firstTop) < 4,
    );

    if (!isSingleRow) {
      this.tierColumnLayout.set(null);
      return;
    }

    const drawableWidth = VIEWBOX_WIDTH - CHART_PADDING_X * 2;
    const layouts = metricEls.map(metric => {
      const rect = metric.getBoundingClientRect();
      const left = rect.left - chartRect.left;
      return {
        x: CHART_PADDING_X + (left / chartRect.width) * drawableWidth,
        width: (rect.width / chartRect.width) * drawableWidth,
      };
    });

    this.tierColumnLayout.set(layouts);
  }

  private buildSegmentGeometry(
    tiers: FunnelTier[],
    columnLayout: TierColumnLayout[] | null,
  ): FunnelSegmentGeometry[] {
    if (tiers.length === 0) {
      return [];
    }

    const chartWidth = VIEWBOX_WIDTH - CHART_PADDING_X * 2;
    const blockBudget = chartWidth - (tiers.length - 1) * CONNECTOR_WIDTH;
    const equalBlockWidth = blockBudget / tiers.length;

    const tierHeights = this.getTierHeights(tiers.length);
    const tierBounds = this.getSymmetricTierBounds(tierHeights);

    const useColumnLayout =
      columnLayout?.length === tiers.length &&
      columnLayout.every(column => column.width > 0);

    let fallbackX = CHART_PADDING_X;
    const segments: FunnelSegmentGeometry[] = [];

    tiers.forEach((tier, index) => {
      const column = useColumnLayout ? columnLayout![index] : null;
      const width = column?.width ?? equalBlockWidth;
      const x = column?.x ?? fallbackX;
      const { yTop, yBottom, height } = tierBounds[index];
      const isFirst = index === 0;
      const isLast = index === tiers.length - 1;

      const blockPath = this.buildBlockPath(x, yTop, width, height, isFirst, isLast);
      const centerX = x + width / 2;
      const centerY = yTop + height / 2;

      let connectorPath: string | null = null;
      if (!isLast) {
        const nextBounds = tierBounds[index + 1];
        const connectorX = x + width;
        const connectorEndX = useColumnLayout
          ? columnLayout![index + 1].x
          : connectorX + CONNECTOR_WIDTH;
        connectorPath = [
          `M ${connectorX} ${yTop}`,
          `L ${connectorEndX} ${nextBounds.yTop}`,
          `L ${connectorEndX} ${nextBounds.yBottom}`,
          `L ${connectorX} ${yBottom}`,
          'Z',
        ].join(' ');
      }

      segments.push({
        index,
        blockPath,
        connectorPath,
        centerX,
        centerY,
      });

      if (!useColumnLayout) {
        fallbackX += width + CONNECTOR_WIDTH;
      }
    });

    return segments;
  }

  private getTierHeights(tierCount: number): number[] {
    if (tierCount === 1) {
      return [FIRST_TIER_HEIGHT];
    }

    return Array.from({ length: tierCount }, (_, index) => {
      const ratio = index / (tierCount - 1);
      return FIRST_TIER_HEIGHT - ratio * (FIRST_TIER_HEIGHT - LAST_TIER_HEIGHT);
    });
  }

  private getSymmetricTierBounds(
    heights: number[],
  ): { yTop: number; yBottom: number; height: number }[] {
    const bounds: { yTop: number; yBottom: number; height: number }[] = [
      { yTop: TOP_BASE, yBottom: TOP_BASE + heights[0], height: heights[0] },
    ];

    for (let index = 1; index < heights.length; index++) {
      const previous = bounds[index - 1];
      const step = (heights[index - 1] - heights[index]) / 2;
      const yTop = previous.yTop + step;
      const yBottom = previous.yBottom - step;
      bounds.push({ yTop, yBottom, height: heights[index] });
    }

    return bounds;
  }

  private buildBlockPath(
    x: number,
    yTop: number,
    width: number,
    height: number,
    isFirst: boolean,
    isLast: boolean,
  ): string {
    const yBottom = yTop + height;
    const radius = Math.min(CORNER_RADIUS, width / 2, height / 2);

    if (isFirst && isLast) {
      return [
        `M ${x + radius} ${yTop}`,
        `L ${x + width - radius} ${yTop}`,
        `Q ${x + width} ${yTop} ${x + width} ${yTop + radius}`,
        `L ${x + width} ${yBottom - radius}`,
        `Q ${x + width} ${yBottom} ${x + width - radius} ${yBottom}`,
        `L ${x + radius} ${yBottom}`,
        `Q ${x} ${yBottom} ${x} ${yBottom - radius}`,
        `L ${x} ${yTop + radius}`,
        `Q ${x} ${yTop} ${x + radius} ${yTop}`,
        'Z',
      ].join(' ');
    }

    if (isFirst) {
      return [
        `M ${x + radius} ${yTop}`,
        `L ${x + width} ${yTop}`,
        `L ${x + width} ${yBottom}`,
        `L ${x + radius} ${yBottom}`,
        `Q ${x} ${yBottom} ${x} ${yBottom - radius}`,
        `L ${x} ${yTop + radius}`,
        `Q ${x} ${yTop} ${x + radius} ${yTop}`,
        'Z',
      ].join(' ');
    }

    if (isLast) {
      const capRadius = Math.min(height / 2, width / 2, END_CAP_RADIUS);
      return [
        `M ${x} ${yTop}`,
        `L ${x + width - capRadius} ${yTop}`,
        `Q ${x + width} ${yTop} ${x + width} ${yTop + capRadius}`,
        `L ${x + width} ${yBottom - capRadius}`,
        `Q ${x + width} ${yBottom} ${x + width - capRadius} ${yBottom}`,
        `L ${x} ${yBottom}`,
        'Z',
      ].join(' ');
    }

    return `M ${x} ${yTop} L ${x + width} ${yTop} L ${x + width} ${yBottom} L ${x} ${yBottom} Z`;
  }

  private resolveTooltip(tier: FunnelTier): FunnelTierTooltip {
    if (tier.tooltip) {
      return tier.tooltip;
    }

    return {
      title: tier.label,
      lines: [this.formatValue(tier.value)],
    };
  }

  private formatValue(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
}
