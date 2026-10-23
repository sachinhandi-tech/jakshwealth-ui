import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { rankedScannerPayload } from './algo-scanner.fixture';
import { AlgoDeskStore } from './algo-desk.store';
import { AlgoSignals } from './algo-signals';
import { FinalTrades } from './final-trades';
import { GttPlacement } from './gtt-placement';
import { GttOrderResult } from './kite.model';
import { KiteService } from './kite.service';

class FakeSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close(): void {
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }
}

function approved(symbol: string, entry: number, stop: number, target: number, last: number) {
  return {
    symbol,
    exchange: 'NSE',
    ai_decision: 'buy',
    gtt_tradable: true,
    entry,
    stop,
    target,
    last_close: last,
    quantity: 1000,
    quantity_basis: 'equity_notional',
    ai_reason: `Entry ${entry} and volume above 3.`,
  };
}

function result(overrides: Partial<GttOrderResult>): GttOrderResult {
  return {
    symbol: 'INFY',
    quantity: 1,
    buy_price: 100,
    stoploss: 95,
    tick_size: 0.05,
    last_price: 101,
    account_state: 'clear',
    position_quantity: 0,
    active_buy_trigger_id: null,
    active_stoploss_trigger_id: null,
    day_buy_order_id: null,
    day_buy_order_status: null,
    buy_status: 'ready',
    buy_trigger_id: null,
    stoploss_status: 'planned_after_buy',
    stoploss_trigger_id: null,
    message: 'Ready for buy GTT placement.',
    ...overrides,
  };
}

describe('GTT Placement', () => {
  let socket: FakeSocket;
  let liveCalls: { confirm_live: boolean }[];

  async function setup(stateOrders: GttOrderResult[], liveOrders: GttOrderResult[]): Promise<{
    placement: ComponentFixture<GttPlacement>;
    signals: ComponentFixture<AlgoSignals>;
    trades: ComponentFixture<FinalTrades>;
  }> {
    socket = new FakeSocket();
    liveCalls = [];
    TestBed.configureTestingModule({
      imports: [AlgoSignals, FinalTrades, GttPlacement],
      providers: [
        provideZonelessChangeDetection(),
        AlgoDeskStore,
        {
          provide: KiteService,
          useValue: {
            scannerData: () => of(rankedScannerPayload()),
            ohlcSnapshot: () => of({ quotes: [{ symbol: 'INFY', last_price: 101 }, { symbol: 'TCS', last_price: 111 }] }),
            openTicks: () => socket as unknown as WebSocket,
            algoSetups: () => of({
              scanned: 2,
              accepted: 2,
              setups: [approved('INFY', 100, 90, 120, 101), approved('TCS', 110, 100, 130, 111)],
              sell_calls: [],
            }),
            gttState: () => of({ orders: stateOrders }),
            liveGtt: (orders: unknown[]) => {
              liveCalls.push({ confirm_live: true, orders } as { confirm_live: boolean });
              return of({ orders: liveOrders });
            },
          },
        },
      ],
    });
    const signals = TestBed.createComponent(AlgoSignals);
    signals.detectChanges();
    await signals.whenStable();
    signals.detectChanges();
    const trades = TestBed.createComponent(FinalTrades);
    trades.detectChanges();
    await trades.whenStable();
    trades.detectChanges();
    const placement = TestBed.createComponent(GttPlacement);
    placement.detectChanges();
    await placement.whenStable();
    placement.detectChanges();
    return { placement, signals, trades };
  }

  it('renders read-only placement rows from Algo Signals and has no placement button', async () => {
    const { placement, signals, trades } = await setup([], []);
    const text = placement.nativeElement.textContent as string;
    expect(text).toContain('GTT Order Placement');
    expect(text).toContain('Kite GTT Placement');
    expect(text).toContain('Read-only status from Algo Signals');
    expect(text).toContain('INFY');
    expect(text).toContain('TCS');
    expect(placement.nativeElement.querySelector('button')).toBeNull();
    expect(text).not.toContain('Run Live');
    expect(signals.nativeElement.textContent).not.toContain('Run Live');
    expect(trades.nativeElement.textContent).toContain('Run Live');
    expect(trades.nativeElement.textContent).toContain('INFY');
  });

  it('places a real buy from Run Live and does not send a blocked row', async () => {
    const ready = [
      result({ symbol: 'INFY', buy_status: 'ready', message: 'Ready for buy GTT placement.' }),
      result({ symbol: 'TCS', buy_status: 'blocked', account_state: 'day_buy_order_exists', message: 'Skipped: day BUY order already exists.' }),
    ];
    const placed = [result({
      symbol: 'INFY',
      buy_status: 'success',
      buy_trigger_id: '4242',
      message: 'Buy GTT placed on Kite. Stoploss planned after buy execution.',
    })];
    const { placement: fixture, trades } = await setup(ready, placed);
    expect(trades.nativeElement.textContent).toContain('Run Live');
    await trades.componentInstance.runLive();
    fixture.detectChanges();

    expect(liveCalls).toHaveLength(1);
    expect(JSON.stringify(liveCalls[0])).toContain('INFY');
    expect(JSON.stringify(liveCalls[0])).not.toContain('TCS');
    expect(fixture.nativeElement.textContent).toContain('4242');
    expect(fixture.nativeElement.textContent).toContain('Buy GTT placed on Kite. Stoploss planned after buy execution.');
    expect(fixture.nativeElement.textContent).toContain('Skipped: day BUY order already exists.');

    const store = TestBed.inject(AlgoDeskStore);
    const service = TestBed.inject(KiteService) as unknown as { gttState: () => ReturnType<KiteService['gttState']> };
    service.gttState = () => of({
      orders: [result({
        symbol: 'INFY',
        buy_status: 'already_active',
        account_state: 'already_active',
        buy_trigger_id: '4242',
        message: 'Skipped: buy GTT already active.',
      }), result({
        symbol: 'TCS',
        buy_status: 'blocked',
        account_state: 'day_buy_order_exists',
        message: 'Skipped: day BUY order already exists.',
      })],
    });
    await store.runLive();
    fixture.detectChanges();
    expect(liveCalls).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Skipped: buy GTT already active.');
    expect(fixture.nativeElement.textContent).toContain('4242');
  });

  it('shows Waiting until a shared tick arrives and then updates both tables', async () => {
    TestBed.configureTestingModule({
      imports: [AlgoSignals, GttPlacement],
      providers: [
        provideZonelessChangeDetection(),
        AlgoDeskStore,
        {
          provide: KiteService,
          useValue: {
            scannerData: () => of(rankedScannerPayload()),
            ohlcSnapshot: () => of({ quotes: [] }),
            openTicks: () => {
              socket = new FakeSocket();
              return socket as unknown as WebSocket;
            },
          },
        },
      ],
    });
    const signals = TestBed.createComponent(AlgoSignals);
    signals.detectChanges();
    await signals.whenStable();
    signals.detectChanges();
    const placement = TestBed.createComponent(GttPlacement);
    placement.detectChanges();
    expect(placement.nativeElement.textContent).toContain('Waiting');

    socket.onmessage?.({ data: JSON.stringify({ instrument_token: 408065, last_price: 2500.5 }) });
    signals.detectChanges();
    placement.detectChanges();
    expect(signals.nativeElement.textContent.replace(/,/g, '')).toContain('2500.50');
    expect(placement.nativeElement.textContent.replace(/,/g, '')).toContain('2500.5');
  });
});
