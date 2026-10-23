import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AlgoDeskStore } from './algo-desk.store';

@Component({
  selector: 'app-final-trades',
  imports: [DecimalPipe],
  templateUrl: './final-trades.html',
  styleUrl: './algo-signals.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalTrades {
  readonly store = inject(AlgoDeskStore);

  constructor() {
    void this.store.refreshFinal();
  }

  runLive(): Promise<void> {
    return this.store.runLive();
  }
}
