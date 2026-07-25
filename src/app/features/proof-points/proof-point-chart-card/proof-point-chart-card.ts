import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CardModule } from '@cigna/cigna_dae_ngui_library/lib/card';
import { ChartsModule } from '@cigna/cigna_dae_ngui_library/lib/charts';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import { ProofPointChartConfig } from '../proof-points-charts-api.model';

@Component({
  selector: 'app-proof-point-chart-card',
  imports: [CardModule, ChartsModule, TypographyModule],
  templateUrl: './proof-point-chart-card.html',
  styleUrl: './proof-point-chart-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProofPointChartCard {
  readonly chart = input.required<ProofPointChartConfig>();
  readonly activeViewLabel = input.required<string>();

  readonly isDoughnutHeaderLayout = computed(() => this.chart().layout === 'doughnut-header');

  readonly presentation = computed(() => this.chart().presentation);

  readonly legendOnRight = computed(() => {
    const plugins = this.chart().options['plugins'] as Record<string, unknown> | undefined;
    const legend = plugins?.['legend'] as { position?: string } | undefined;
    return legend?.position === 'right';
  });
}
