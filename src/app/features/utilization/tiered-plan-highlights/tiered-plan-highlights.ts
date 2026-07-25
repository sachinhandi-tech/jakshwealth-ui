import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UtilizationTab } from '../utilization-tab/utilization-tab';

@Component({
  selector: 'app-tiered-plan-highlights',
  imports: [UtilizationTab],
  styles: [`:host { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }`],
  template: `
    <app-utilization-tab
      tabId="tiered-plan-highlights"
      title="Tiered Plan Highlights"
      description="Summary metrics and highlights for tiered plan utilization." />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TieredPlanHighlights {}
