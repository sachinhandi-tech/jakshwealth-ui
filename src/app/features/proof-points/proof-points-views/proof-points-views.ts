import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  input,
  output,
} from '@angular/core';

import { IconModule } from '@cigna/cigna_dae_ngui_library/lib/icon';

import { ProofPointViewItem } from '../proof-points.model';

@Component({
  selector: 'app-proof-points-views',
  imports: [IconModule],
  templateUrl: './proof-points-views.html',
  styleUrl: './proof-points-views.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProofPointsViews {
  readonly views = input.required<ProofPointViewItem[]>();
  readonly activeViewId = input.required<string>();
  readonly visible = input(false);
  readonly isCollapsed = input(false);
  readonly isNarrow = input(false);

  readonly visibleChange = output<boolean>();
  readonly viewChange = output<string>();

  @HostBinding('class.proof-points-views-host--collapsed')
  get collapsedHost(): boolean {
    return this.isCollapsed();
  }

  @HostBinding('class.proof-points-views-host--narrow')
  get narrowHost(): boolean {
    return this.isNarrow();
  }

  togglePanel(): void {
    this.visibleChange.emit(!this.visible());
  }

  closePanel(): void {
    this.visibleChange.emit(false);
  }

  selectView(viewId: string): void {
    this.viewChange.emit(viewId);
    if (this.isCollapsed()) {
      this.closePanel();
    }
  }
}
