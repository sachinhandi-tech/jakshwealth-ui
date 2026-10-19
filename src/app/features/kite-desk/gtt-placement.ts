import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AlgoDeskStore } from './algo-desk.store';

@Component({
  selector: 'app-gtt-placement',
  templateUrl: './gtt-placement.html',
  styleUrl: './gtt-placement.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GttPlacement {
  readonly store = inject(AlgoDeskStore);

  constructor() {
    this.store.ensureLoaded();
  }

  price(value: number | null): string {
    if (value === null || !Number.isFinite(value)) {
      return 'Not available';
    }
    return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }

  lastPrice(value: number | null): string {
    return value === null ? 'Waiting' : this.price(value);
  }

  dayOrder(row: { dayBuyOrderId: string | null; dayBuyOrderStatus: string | null }): string {
    if (!row.dayBuyOrderId) {
      return '—';
    }
    return row.dayBuyOrderStatus ? `${row.dayBuyOrderId} · ${row.dayBuyOrderStatus}` : row.dayBuyOrderId;
  }
}
