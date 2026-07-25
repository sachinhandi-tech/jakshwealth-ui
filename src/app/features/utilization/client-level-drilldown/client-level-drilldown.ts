import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UtilizationTab } from '../utilization-tab/utilization-tab';

@Component({
  selector: 'app-client-level-drilldown',
  imports: [UtilizationTab],
  styles: [`:host { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }`],
  template: `
    <app-utilization-tab
      tabId="client-level-drilldown"
      title="Client Level Drilldown"
      description="Client-level utilization drilldown by quarter and client." />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientLevelDrilldown {}
