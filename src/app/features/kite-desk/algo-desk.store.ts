import { computed, Injectable, inject, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BreakoutSetup, readStocks, scanBreakouts } from './algo-scanner';
import {
  GttOrderRequest,
  GttOrderResult,
} from './kite.model';
import { KiteService } from './kite.service';

export interface GttViewRow {
  rank: number;
  symbol: string;
  quantity: number;
  buyPrice: number | null;
  stoploss: number | null;
  lastPrice: number | null;
  accountState: string;
  buyStatus: string;
  buyTriggerId: string | null;
  dayBuyOrderId: string | null;
  dayBuyOrderStatus: string | null;
  positionQuantity: number;
  stoplossStatus: string;
  stoplossTriggerId: string | null;
  message: string;
}

const blockedStates = new Set(['blocked', 'already_active', 'position_exists', 'day_buy_order_exists']);

@Injectable()
export class AlgoDeskStore implements OnDestroy {
  private readonly kite = inject(KiteService);
  private socket: WebSocket | null = null;
  private loaded = false;
  private stopped = false;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly scanned = signal(0);
  readonly universe = signal(0);
  readonly filling = signal(false);
  readonly setups = signal<BreakoutSetup[]>([]);
  readonly tickStatus = signal('Connecting to live ticks…');
  readonly running = signal(false);
  readonly gttError = signal<string | null>(null);
  readonly livePrices = signal<ReadonlyMap<number, number>>(new Map());
  readonly snapshotPrices = signal<ReadonlyMap<string, number>>(new Map());
  private readonly gttResults = signal<ReadonlyMap<string, GttOrderResult>>(new Map());

  readonly gttRows = computed(() => {
    const results = this.gttResults();
    const running = this.running();
    return this.setups().map((setup, index) => this.toGttRow(setup, index, results.get(setup.symbol), running));
  });

  ensureLoaded(): void {
    if (this.loaded || this.loading()) {
      return;
    }
    void this.reload();
  }

  ngOnDestroy(): void {
    this.stopped = true;
    this.closeTicks();
  }

  async runLive(): Promise<void> {
    if (this.running()) {
      return;
    }
    this.running.set(true);
    this.gttError.set(null);
    try {
      await this.reload();
      if (this.error()) {
        return;
      }
      await new Promise<void>(resolve => this.refreshSnapshot(resolve));
      this.gttResults.set(new Map());
      const candidates = this.candidates();
      if (candidates.length === 0) {
        return;
      }
      const state = await firstValueFrom(this.kite.gttState(candidates));
      this.remember(state.orders);
      const ready = (state.orders ?? []).filter(isReady);
      if (ready.length === 0) {
        return;
      }
      const placed = await firstValueFrom(this.kite.liveGtt(ready.map(toRequest)));
      this.remember(placed.orders);
    } catch (err) {
      this.gttError.set(readError(err));
    } finally {
      this.running.set(false);
    }
  }

  signalPrice(row: BreakoutSetup): number {
    return this.quotePrice(row) ?? row.currentPrice;
  }

  private reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.filling.set(false);
    return new Promise(resolve => this.pullScanner(resolve, 0));
  }

  private pullScanner(done: () => void, pages: number): void {
    if (this.stopped) {
      done();
      return;
    }
    this.kite.scannerData().subscribe({
      next: payload => {
        if (this.stopped) {
          done();
          return;
        }
        try {
          const result = scanBreakouts(readStocks(payload));
          const meta = scannerMeta(payload);
          const symbols = new Set(result.setups.map(setup => setup.symbol));
          this.gttResults.update(current => {
            const next = new Map(current);
            for (const symbol of next.keys()) {
              if (!symbols.has(symbol)) {
                next.delete(symbol);
              }
            }
            return next;
          });
          this.scanned.set(meta.scanned ?? result.scanned);
          this.universe.set(meta.universe ?? this.scanned());
          this.setups.set(result.setups);
          this.loaded = true;
          this.loading.set(false);
          this.connectTicks(result.setups);
          const stillFilling = meta.complete === false && pages < 500;
          this.filling.set(stillFilling);
          if (stillFilling) {
            this.pullScanner(done, pages + 1);
            return;
          }
          this.refreshSnapshot(done);
        } catch (err) {
          this.failLoad(err);
          done();
        }
      },
      error: err => {
        this.failLoad(err);
        done();
      },
    });
  }

  private refreshSnapshot(done: () => void = () => undefined): void {
    const symbols = this.setups().map(setup => setup.symbol);
    if (symbols.length === 0) {
      this.snapshotPrices.set(new Map());
      this.tickStatus.set('No live tick subscription.');
      this.loading.set(false);
      done();
      return;
    }
    const prices = new Map<string, number>();
    const chunks: string[][] = [];
    for (let index = 0; index < symbols.length; index += 200) {
      chunks.push(symbols.slice(index, index + 200));
    }
    const next = (index: number) => {
      if (index >= chunks.length) {
        this.snapshotPrices.set(prices);
        this.loading.set(false);
        done();
        return;
      }
      this.kite.ohlcSnapshot(chunks[index]).subscribe({
        next: snapshot => {
          for (const quote of snapshot.quotes ?? []) {
            if (typeof quote.last_price === 'number' && Number.isFinite(quote.last_price)) {
              prices.set(quote.symbol, quote.last_price);
            }
          }
          next(index + 1);
        },
        error: () => next(index + 1),
      });
    };
    next(0);
  }

  private failLoad(err: unknown): void {
    this.loaded = false;
    this.loading.set(false);
    this.error.set(err instanceof Error && !(err as { error?: { detail?: unknown } }).error
      ? err.message
      : readError(err));
  }

  private candidates(): GttOrderRequest[] {
    return this.setups().map(setup => {
      const buy = setup.breakoutLow > 0 ? setup.breakoutLow : null;
      return {
        symbol: setup.symbol,
        quantity: 1,
        buy_price: buy,
        stoploss: buy === null ? null : buy * 0.95,
        last_price: this.quotePrice(setup),
      };
    });
  }

  private remember(orders: GttOrderResult[] | null | undefined): void {
    this.gttResults.update(current => {
      const next = new Map(current);
      for (const order of orders ?? []) {
        next.set(order.symbol, order);
      }
      return next;
    });
  }

  private toGttRow(setup: BreakoutSetup, index: number, saved: GttOrderResult | undefined, running: boolean): GttViewRow {
    const lastPrice = this.quotePrice(setup);
    if (saved) {
      return {
        rank: index + 1,
        symbol: setup.symbol,
        quantity: saved.quantity || 1,
        buyPrice: saved.buy_price,
        stoploss: saved.stoploss,
        lastPrice,
        accountState: saved.account_state,
        buyStatus: saved.buy_status,
        buyTriggerId: saved.buy_trigger_id,
        dayBuyOrderId: saved.day_buy_order_id,
        dayBuyOrderStatus: saved.day_buy_order_status,
        positionQuantity: saved.position_quantity,
        stoplossStatus: saved.stoploss_status,
        stoplossTriggerId: saved.stoploss_trigger_id,
        message: saved.message,
      };
    }
    const buyPrice = setup.breakoutLow > 0 ? setup.breakoutLow : null;
    const waiting = lastPrice === null;
    return {
      rank: index + 1,
      symbol: setup.symbol,
      quantity: 1,
      buyPrice,
      stoploss: buyPrice === null ? null : buyPrice * 0.95,
      lastPrice,
      accountState: buyPrice === null ? 'invalid' : waiting ? 'waiting' : 'clear',
      buyStatus: buyPrice === null ? 'not_available' : waiting ? 'waiting_for_ltp' : running ? 'checking' : 'not_placed',
      buyTriggerId: null,
      dayBuyOrderId: null,
      dayBuyOrderStatus: null,
      positionQuantity: 0,
      stoplossStatus: buyPrice === null ? 'not_available' : 'planned_after_buy',
      stoplossTriggerId: null,
      message: buyPrice === null ? 'Buy price is not available for this row.' : waiting ? 'Waiting for LTP.' : '',
    };
  }

  private quotePrice(row: BreakoutSetup): number | null {
    const live = row.instrumentToken === null ? undefined : this.livePrices().get(row.instrumentToken);
    if (live !== undefined) {
      return live;
    }
    const snapshot = this.snapshotPrices().get(row.symbol);
    return snapshot === undefined ? null : snapshot;
  }

  private connectTicks(setups: BreakoutSetup[]): void {
    this.closeTicks();
    const tokens = [...new Set(setups.flatMap(row => row.instrumentToken === null ? [] : [row.instrumentToken]))];
    if (tokens.length === 0) {
      this.tickStatus.set('No live tick subscription.');
      return;
    }
    this.tickStatus.set('Connecting to live ticks…');
    let socket: WebSocket;
    try {
      socket = this.kite.openTicks(tokens);
    } catch {
      this.tickStatus.set('Live ticks unavailable. Showing the OHLC snapshot.');
      return;
    }
    this.socket = socket;
    socket.onopen = () => this.tickStatus.set('Live ticks connected');
    socket.onmessage = event => this.applyTick(event.data);
    socket.onerror = () => this.tickStatus.set('Live ticks unavailable. Showing the OHLC snapshot.');
    socket.onclose = () => {
      const status = this.tickStatus();
      if (status === 'Connecting to live ticks…' || status === 'Live ticks connected') {
        this.tickStatus.set('Live ticks unavailable. Showing the OHLC snapshot.');
      }
    };
  }

  private applyTick(data: unknown): void {
    if (typeof data !== 'string') {
      return;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }
    const ticks = Array.isArray(payload) ? payload : [payload];
    this.livePrices.update(current => {
      const next = new Map(current);
      for (const tick of ticks) {
        if (!tick || typeof tick !== 'object') {
          continue;
        }
        const row = tick as { instrument_token?: unknown; last_price?: unknown };
        const token = typeof row.instrument_token === 'number' ? row.instrument_token : Number(row.instrument_token);
        const price = typeof row.last_price === 'number' ? row.last_price : Number(row.last_price);
        if (Number.isInteger(token) && Number.isFinite(price)) {
          next.set(token, price);
        }
      }
      return next;
    });
  }

  private closeTicks(): void {
    const socket = this.socket;
    this.socket = null;
    if (!socket) {
      return;
    }
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
  }
}

function isReady(order: GttOrderResult): boolean {
  if (blockedStates.has(order.account_state) || blockedStates.has(order.buy_status)) {
    return false;
  }
  return order.buy_status === 'ready' && order.buy_price !== null && order.stoploss !== null && order.last_price !== null;
}

function toRequest(order: GttOrderResult): GttOrderRequest {
  return {
    symbol: order.symbol,
    quantity: 1,
    buy_price: order.buy_price,
    stoploss: order.stoploss,
    last_price: order.last_price,
  };
}

function scannerMeta(payload: unknown): { scanned?: number; universe?: number; complete?: boolean } {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const metadata = (payload as { metadata?: unknown }).metadata;
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  const row = metadata as { scanned?: unknown; universe?: unknown; complete?: unknown };
  return {
    scanned: typeof row.scanned === 'number' ? row.scanned : undefined,
    universe: typeof row.universe === 'number' ? row.universe : undefined,
    complete: typeof row.complete === 'boolean' ? row.complete : undefined,
  };
}

function readError(err: unknown): string {
  if (err instanceof Error && err.message && !err.message.startsWith('The scanner cache could not be read')) {
    const detail = (err as { error?: { detail?: unknown } }).error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }
  const detail = (err as { error?: { detail?: unknown } })?.error?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'The scanner cache could not be loaded.';
}
