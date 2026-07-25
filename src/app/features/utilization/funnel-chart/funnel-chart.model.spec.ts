import { describe, expect, it } from 'vitest';

import {
  buildFunnelChartViewModel,
  DEFAULT_FUNNEL_TIER_COLORS,
  TIERED_MEMBERSHIP_FUNNEL_CHART,
} from './funnel-chart.model';

describe('buildFunnelChartViewModel', () => {
  it('maps API payload fields into the funnel view-model', () => {
    const viewModel = buildFunnelChartViewModel(TIERED_MEMBERSHIP_FUNNEL_CHART);

    expect(viewModel.chartId).toBe('tiered-membership');
    expect(viewModel.title).toBe('Tiered Membership');
    expect(viewModel.subtitle).toBe('Chart explanation goes here');
    expect(viewModel.ariaLabel).toBe('Tiered Membership');
    expect(viewModel.tiers).toHaveLength(4);
    expect(viewModel.tiers[0]).toMatchObject({
      label: 'Cigna Members',
      value: 1_000_000,
      color: DEFAULT_FUNNEL_TIER_COLORS[0],
      tooltip: {
        title: 'Cigna Members',
        lines: ['1,000,000 total members'],
      },
    });
  });

  it('parses hover messages with and without newline separators', () => {
    const viewModel = buildFunnelChartViewModel({
      chartId: 'funnel-tooltips',
      chartType: 'funnel',
      title: 'Tooltip Test',
      labels: ['With newline', 'Without newline'],
      data: [100, 200],
      hoverMessages: ['Title A\nBody A', 'Single line only'],
    });

    expect(viewModel.tiers[0].tooltip).toEqual({
      title: 'Title A',
      lines: ['Body A'],
    });
    expect(viewModel.tiers[1].tooltip).toEqual({
      title: 'Single line only',
    });
  });

  it('uses default colors and formatted values when hover messages are omitted', () => {
    const viewModel = buildFunnelChartViewModel({
      chartId: 'funnel-defaults',
      chartType: 'funnel',
      title: 'Defaults',
      labels: ['Tier A', 'Tier B'],
      data: [1234, 5678],
    });

    expect(viewModel.tiers[0].color).toBe(DEFAULT_FUNNEL_TIER_COLORS[0]);
    expect(viewModel.tiers[1].color).toBe(DEFAULT_FUNNEL_TIER_COLORS[1]);
    expect(viewModel.tiers[0].tooltip).toEqual({
      title: 'Tier A',
      lines: ['1,234'],
    });
  });

  it('limits tiers to the shorter of labels and data arrays', () => {
    const viewModel = buildFunnelChartViewModel({
      chartId: 'funnel-trim',
      chartType: 'funnel',
      title: 'Trimmed',
      labels: ['One', 'Two', 'Three'],
      data: [10, 20],
    });

    expect(viewModel.tiers).toHaveLength(2);
    expect(viewModel.tiers[1].label).toBe('Two');
  });

  it('flattens two-dimensional data arrays', () => {
    const viewModel = buildFunnelChartViewModel({
      chartId: 'funnel-matrix',
      chartType: 'funnel',
      title: 'Matrix',
      labels: ['A', 'B', 'C'],
      data: [[100, 200], [300]],
    });

    expect(viewModel.tiers.map(tier => tier.value)).toEqual([100, 200, 300]);
  });
});
