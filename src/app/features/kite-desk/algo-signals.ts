import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { BreakoutSetup, formatMultiple, formatSignedPercent } from './algo-scanner';
import { AlgoDeskStore } from './algo-desk.store';

@Component({
  selector: 'app-algo-signals',
  imports: [DecimalPipe],
  templateUrl: './algo-signals.html',
  styleUrl: './algo-signals.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlgoSignals {
  readonly store = inject(AlgoDeskStore);
  readonly selectedSymbol = signal<string | null>(null);

  constructor() {
    this.store.ensureLoaded();
  }

  displayPrice(row: BreakoutSetup): number {
    return this.store.signalPrice(row);
  }

  multiple(value: number): string {
    return formatMultiple(value);
  }

  signedPercent(value: number): string {
    return formatSignedPercent(value);
  }

  selectRow(symbol: string): void {
    this.selectedSymbol.set(symbol);
  }
}
