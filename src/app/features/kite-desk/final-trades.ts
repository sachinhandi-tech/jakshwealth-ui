import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

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
  readonly mode = input<'screens' | 'wealth30'>('screens');
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

  scanningHere(): boolean {
    return this.store.finalWorking() && !this.store.finalPaused() && this.store.scanMode() === this.mode();
  }

  runLive(): Promise<void> {
    return this.store.runLive(this.mode());
  }

  toggleScan(): Promise<void> {
    return this.store.toggleScan(this.mode());
  }

  toggleCap(cap: CapSegment): void {
    this.store.toggleCap(cap);
  }
}
