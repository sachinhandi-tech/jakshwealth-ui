import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AlgoDeskStore } from './algo-desk.store';
import { CapSegment } from './kite.model';

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
  readonly caps: { id: CapSegment; label: string }[] = [
    { id: 'large', label: 'Large cap (Nifty 100)' },
    { id: 'mid', label: 'Mid cap (Nifty Midcap 150)' },
    { id: 'small', label: 'Small cap (Nifty Smallcap 250)' },
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

  toggleCap(cap: CapSegment): void {
    this.store.toggleCap(cap);
  }
}
