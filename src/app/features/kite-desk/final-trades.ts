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
  readonly grids = [
    { id: 'equity', title: 'Equity' },
  ];

  constructor() {
    void this.store.refreshFinal();
  }

  runLive(): Promise<void> {
    return this.store.runLive();
  }

  toggleScan(): Promise<void> {
    return this.store.toggleScan();
  }
}
