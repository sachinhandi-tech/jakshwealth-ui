import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import { ProofPointChartCard } from '../proof-point-chart-card/proof-point-chart-card';
import { ProofPointChartConfig } from '../proof-points-charts-api.model';

const CHART_ASPECT_RATIO = '16 / 10';
const CHART_CARD_MIN_WIDTH = '480px';
const CHART_CARD_MAX_WIDTH = '660px';

@Component({
  selector: 'app-proof-points-charts',
  imports: [ProofPointChartCard, TypographyModule],
  templateUrl: './proof-points-charts.html',
  styleUrl: './proof-points-charts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProofPointsCharts {
  readonly activeViewLabel = input.required<string>();
  readonly charts = input<ProofPointChartConfig[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly chartAspectRatio = CHART_ASPECT_RATIO;
  protected readonly chartCardMinWidth = CHART_CARD_MIN_WIDTH;
  protected readonly chartCardMaxWidth = CHART_CARD_MAX_WIDTH;
}
