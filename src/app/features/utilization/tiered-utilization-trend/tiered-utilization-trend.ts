import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UtilizationTab } from '../utilization-tab/utilization-tab';

@Component({
  selector: 'app-tiered-utilization-trend',
  imports: [UtilizationTab],
  styles: [`:host { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }`],
  template: `
    <app-utilization-tab
      tabId="tiered-utilization-trend"
      title="Tiered Utilization Trend"
      description="Trend analysis for tiered utilization across selected filters." />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TieredUtilizationTrend {}
