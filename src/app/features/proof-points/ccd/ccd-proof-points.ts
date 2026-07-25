import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROOF_POINT_VIEWS } from '../proof-points-views.model';
import { ProofPointsTab } from '../proof-points-tab/proof-points-tab';

@Component({
  selector: 'app-ccd-proof-points',
  imports: [ProofPointsTab],
  styles: [`:host { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }`],
  template: `
    <app-proof-points-tab
      designation="ccd"
      [views]="views" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CcdProofPoints {
  readonly views = PROOF_POINT_VIEWS;
}
