import { computed, Injectable, inject, OnDestroy, signal } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';

import { BreakoutSetup, readStocks, scanBreakouts } from './algo-scanner';
import {
  AlgoSetupResult,
  AlgoSetupRow,
  FinalActivity,
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

export interface FinalTrade {
  symbol: string;
  call: string;
  entry: number;
  stop: number;
  target: number;
  lastClose: number;
  quantityLabel: string;
  reason: string;
  exchange: string;
  gttTradable: boolean;
  segment: string;
}

@Injectable()
export class AlgoDeskStore implements OnDestroy {
  private readonly kite = inject(KiteService);
  private socket: WebSocket | null = null;
  private universeTimer: ReturnType<typeof setTimeout> | null = null;
  private universePolls = 0;
  private scanSub: Subscription | null = null;
  private loaded = false;
  private stopped = false;
  private fillCancelled = false;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly scanned = signal(0);
  readonly universe = signal(0);
  readonly filling = signal(false);
  readonly setups = signal<BreakoutSetup[]>([]);
  readonly tickStatus = signal('Connecting to live ticks…');
  readonly running = signal(false);
  readonly gttError = signal<string | null>(null);
  readonly finalTrades = signal<FinalTrade[]>([]);
  readonly sellCalls = signal<FinalTrade[]>([]);
  readonly finalByBook = signal<Record<string, FinalTrade[]>>(emptyBooks());
  readonly sellByBook = signal<Record<string, FinalTrade[]>>(emptyBooks());
  readonly finalLoading = signal(false);
  readonly finalError = signal<string | null>(null);
  readonly finalNote = signal('');
  readonly finalActivity = signal<FinalActivity[]>([]);
  readonly finalWorking = signal(false);
  readonly finalPaused = signal(false);
  readonly scanBusy = signal(false);
  readonly crossoverSignals = signal<{ symbol: string; company_name: string; crossover_type: string }[]>([]);
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
    this.stopFill();
    this.closeTicks();
    if (this.universeTimer !== null) {
      clearTimeout(this.universeTimer);
      this.universeTimer = null;
    }
  }

  setCrossoverSignals(rows: { symbol: string; company_name: string; crossover_type: string }[]): void {
    this.crossoverSignals.set(rows);
  }

  stopFill(): void {
    this.fillCancelled = true;
    this.filling.set(false);
    this.loading.set(false);
    this.scanSub?.unsubscribe();
    this.scanSub = null;
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
      await this.refreshFinal();
      if (this.finalError()) {
        this.gttError.set(this.finalError());
        return;
      }
      const approved = this.finalTrades().filter(row => row.gttTradable && row.call === 'buy' && row.entry > 0);
      if (approved.length === 0) {
        this.gttError.set(this.finalNote() || 'No approved stock to send.');
        return;
      }
      await new Promise<void>(resolve => this.refreshSnapshot(resolve));
      this.gttResults.set(new Map());
      const candidates = approved.map(row => this.toOrder(row));
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

  async toggleScan(): Promise<void> {
    if (this.scanBusy()) {
      return;
    }
    const stopping = this.finalWorking() && !this.finalPaused();
    this.scanBusy.set(true);
    this.finalError.set(null);
    try {
      const result = await firstValueFrom(stopping ? this.kite.stopScan() : this.kite.continueScan());
      this.applyFinal(result);
    } catch (err) {
      if (!isGatewayWait(err)) {
        this.finalError.set(readError(err));
      }
    } finally {
      this.scanBusy.set(false);
    }
  }

  async refreshFinal(quiet = false): Promise<void> {
    if (!quiet) {
      this.finalError.set(null);
      if (this.finalActivity().length === 0) {
        this.finalActivity.set([{ text: 'Opening the NSE and BSE equity read.', state: 'active' }]);
        this.finalWorking.set(true);
      }
    }
    try {
      const result = await firstValueFrom(this.kite.algoSetups([], []));
      this.applyFinal(result);
    } catch (err) {
      if (isGatewayWait(err)) {
        this.finalError.set(null);
        this.finalWorking.set(true);
        this.finalActivity.set([{ text: 'The desk is still reading. Checking again.', state: 'active' }]);
        this.scheduleFinal(true);
        return;
      }
      this.finalError.set(readError(err));
    }
  }

  signalPrice(row: BreakoutSetup): number {
    return this.quotePrice(row) ?? row.currentPrice;
  }

  private reload(): Promise<void> {
    this.fillCancelled = false;
    this.loading.set(true);
    this.error.set(null);
    this.filling.set(false);
    return new Promise(resolve => this.pullScanner(resolve, 0));
  }

  private pullScanner(done: () => void, pages: number): void {
    if (this.stopped || this.fillCancelled) {
      this.filling.set(false);
      this.loading.set(false);
      done();
      return;
    }
    this.scanSub?.unsubscribe();
    this.scanSub = this.kite.scannerData().subscribe({
      next: payload => {
        if (this.stopped || this.fillCancelled) {
          this.filling.set(false);
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

  private applyFinal(result: AlgoSetupResult): void {
    const buys = (result.setups ?? [])
      .filter(row => row.gtt_tradable === true && row.ai_decision === 'buy')
      .map(row => toFinal(row, 'buy'));
    const sells = (result.sell_calls ?? [])
      .filter(row => row.ai_decision === 'sell')
      .map(row => toFinal(row, 'sell'));
    this.finalTrades.set(buys);
    this.sellCalls.set(sells);
    this.finalByBook.set(groupBooks(buys));
    this.sellByBook.set(groupBooks(sells));
    this.finalActivity.set(result.activity ?? []);
    this.finalPaused.set(result.paused === true);
    const working = result.paused !== true && (result.working === true || (result.working == null && !!result.universe_note));
    this.finalWorking.set(working);
    this.scheduleFinal(working);
    if (buys.length === 0) {
      const stoodAside = (result.setups ?? []).find(row => row.ai_reason);
      this.finalNote.set(result.universe_note || stoodAside?.ai_reason || 'No stock was approved for a trade.');
      return;
    }
    this.finalNote.set('');
  }

  private scheduleFinal(working: boolean): void {
    if (!working) {
      this.universePolls = 0;
      return;
    }
    if (this.universePolls >= 450 || this.universeTimer !== null) {
      return;
    }
    this.universePolls += 1;
    this.universeTimer = setTimeout(() => {
      this.universeTimer = null;
      if (!this.stopped) {
        void this.refreshFinal(true);
      }
    }, 5000);
  }

  private toOrder(row: FinalTrade): GttOrderRequest {
    return {
      symbol: row.symbol,
      exchange: row.exchange,
      quantity: 1,
      buy_price: row.entry,
      stoploss: row.stop,
      last_price: this.lastFor(row),
    };
  }

  private lastFor(row: FinalTrade): number | null {
    const setup = this.setups().find(item => item.symbol === row.symbol);
    if (setup) {
      const quote = this.quotePrice(setup);
      if (quote !== null) {
        return quote;
      }
    }
    return row.lastClose > 0 ? row.lastClose : null;
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

function toFinal(row: AlgoSetupRow, call: string): FinalTrade {
  let quantityLabel = '1 lakh';
  if (row.quantity_basis === 'one_lot') {
    quantityLabel = '1 lot';
  } else if (typeof row.quantity === 'number' && row.quantity > 0) {
    quantityLabel = String(row.quantity);
  }
  return {
    symbol: row.symbol,
    call,
    entry: row.entry ?? 0,
    stop: row.stop ?? 0,
    target: row.target ?? 0,
    lastClose: row.last_close ?? 0,
    quantityLabel,
    reason: row.ai_reason || row.reason || '',
    exchange: row.exchange || 'NSE',
    gttTradable: row.gtt_tradable === true,
    segment: row.segment || 'equity',
  };
}

function emptyBooks(): Record<string, FinalTrade[]> {
  return { equity: [], stock_future: [], stock_option: [], commodity_future: [] };
}

function groupBooks(rows: FinalTrade[]): Record<string, FinalTrade[]> {
  const books = emptyBooks();
  for (const row of rows) {
    const key = books[row.segment] ? row.segment : 'equity';
    books[key].push(row);
  }
  return books;
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

function isGatewayWait(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 502 || status === 504 || status === 0;
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
