import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { rankedScannerPayload } from './algo-scanner.fixture';
import { AlgoDeskStore } from './algo-desk.store';
import { AlgoSignals } from './algo-signals';
import { KiteDashboard } from './kite-dashboard';
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

describe('AlgoSignals', () => {
  let fixture: ComponentFixture<AlgoSignals>;
  let socket: FakeSocket;

  async function setup(service: Partial<KiteService>): Promise<void> {
    socket = new FakeSocket();
    TestBed.configureTestingModule({
      imports: [AlgoSignals],
      providers: [
        provideZonelessChangeDetection(),
        AlgoDeskStore,
        {
          provide: KiteService,
          useValue: {
            scannerData: () => of({ stocks: [] }),
            ohlcSnapshot: () => of({ quotes: [] }),
            openTicks: () => socket as unknown as WebSocket,
            ...service,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(AlgoSignals);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows the scanner cache error above the table', async () => {
    await setup({
      scannerData: () => throwError(() => ({ error: { detail: 'The scanner cache is still loading.' } })),
    });
    expect(fixture.nativeElement.textContent).toContain('The scanner cache is still loading.');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('shows the empty state when nothing qualifies', async () => {
    await setup({});
    expect(fixture.nativeElement.textContent).toContain('No breakout retest setups match the current parameters.');
    expect(fixture.nativeElement.textContent).toContain('0');
    expect(fixture.nativeElement.textContent).toContain('No live tick subscription.');
  });

  it('renders a ranked row, keeps that rank when the tick changes, and highlights the selection', async () => {
    await setup({
      scannerData: () => of(rankedScannerPayload()),
      ohlcSnapshot: () => of({ quotes: [{ symbol: 'TCS', last_price: 111 }, { symbol: 'INFY', last_price: 101 }] }),
    });

    const symbols = [...fixture.nativeElement.querySelectorAll('.algo__symbol')].map(item => item.textContent?.trim());
    expect(symbols).toEqual(['INFY', 'TCS']);
    expect(fixture.nativeElement.textContent).toContain('4.00x');
    expect(fixture.nativeElement.textContent).toContain('0.00%');
    expect(fixture.nativeElement.textContent).toContain('Triggered Breakouts');

    socket.onopen?.();
    socket.onmessage?.({ data: JSON.stringify({ instrument_token: 408065, last_price: 2500.5 }) });
    fixture.detectChanges();
    const prices = [...fixture.nativeElement.querySelectorAll('tbody td:nth-child(3)')].map(item => item.textContent?.replace(/,/g, '').trim());
    expect(prices[0]).toBe('2500.50');
    expect(prices[1]).toContain('111.00');
    const ranked = [...fixture.nativeElement.querySelectorAll('.algo__symbol')].map(item => item.textContent?.trim());
    expect(ranked).toEqual(['INFY', 'TCS']);
    expect(fixture.nativeElement.textContent).toContain('Live ticks connected');

    (fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody tr')?.classList.contains('algo__row--selected')).toBe(true);
  });
});

describe('final list tab', () => {
  it('opens from the dashboard and does not ask for the strategy tabs', async () => {
    TestBed.configureTestingModule({
      imports: [KiteDashboard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: KiteService,
          useValue: {
            profile: () => of({ user_name: 'Desk', user_id: 'AB1234', products: [], exchanges: [] }),
            logout: () => of({ authenticated: false, user_name: null, user_id: null }),
            quotes: () => of([]),
            latestScans: () => of({ short: null, long: null }),
            scannerData: () => of({ stocks: [] }),
            ohlcSnapshot: () => of({ quotes: [] }),
            algoSetups: () => of({
              scanned: 0,
              accepted: 0,
              setups: [],
              sell_calls: [],
              working: false,
              activity: [{ text: 'Reading NSE and BSE equities.', state: 'done' }],
            }),
            openTicks: () => new FakeSocket() as unknown as WebSocket,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(KiteDashboard);
    fixture.detectChanges();
    const labels = [...fixture.nativeElement.querySelectorAll('.desk__tab')].map(item => item.textContent?.trim());
    expect(labels).toContain('Final list');
    expect(labels).not.toContain('ma-crossover');
    expect(labels).not.toContain('price-volume-expansion');
    const finalButton = [...fixture.nativeElement.querySelectorAll('button')].find(item =>
      item.textContent?.includes('Final list'),
    ) as HTMLButtonElement;
    finalButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Run Live');
    expect(fixture.nativeElement.textContent).toContain('Reading NSE and BSE equities.');
    expect(fixture.nativeElement.textContent).toContain('No stock was approved for a trade.');
  });
});
