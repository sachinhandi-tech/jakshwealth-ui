import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ProofPointChartCard } from '../../../proof-points/proof-point-chart-card/proof-point-chart-card';
import { ProofPointChartConfig } from '../../../proof-points/proof-points-charts-api.model';

@Component({
  selector: 'app-chat-chart',
  imports: [ProofPointChartCard],
  templateUrl: './chat-chart.html',
  styleUrl: './chat-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatChart {
  readonly chart = input.required<ProofPointChartConfig>();
}
