import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { KiteDashboard } from './kite-dashboard';
import { KiteService } from './kite.service';
import { KiteSignal, KiteSignalJob, KiteSignalResult } from './kite.model';

function row(overrides: Partial<KiteSignal> & Pick<KiteSignal, 'rank' | 'ticker' | 'company'>): KiteSignal {
  return {
    crossover_type: 'bullish',
    crossover_date: '2026-10-01',
    close: 100,
    short_sma: 10,
    long_sma: 20,
    trend_sma: 30,
    trend_bias: 'above',
    reason: 'The 20 EMA crossed above the 50 SMA.',
    ...overrides,
  };
}

function scan(signals: KiteSignal[], mode: KiteSignalResult['scan_mode'] = 'crossover'): KiteSignalResult {
  return {
    scan_mode: mode,
    ma_type: 'ema',
    short_type: 'ema',
    long_type: 'sma',
    trend_window: 200,
    short_window: 20,
    long_window: 50,
    lookback_days: 60,
    universe: 100,
    scanned: 25,
    skipped: 0,
    signals,
  };
}

describe('KiteDashboard signals', () => {
  let fixture: ComponentFixture<KiteDashboard>;
  let jobs: Subject<KiteSignalJob>;
  let nextResult: KiteSignalResult;
  let pollStarted: Promise<void>;
  let markPollStarted: () => void;

  beforeEach(async () => {
    jobs = new Subject<KiteSignalJob>();
    pollStarted = new Promise(resolve => {
      markPollStarted = resolve;
    });
    const kite = {
      profile: () => of({ user_name: 'Desk', user_id: 'AB1234', products: [], exchanges: [] }),
      logout: () => of({ authenticated: false, user_name: null, user_id: null }),
      quotes: () => of([]),
      startScan: () => of({ job_id: 'job-1', status: 'running' }),
      signalJob: () => {
        markPollStarted();
        return jobs.asObservable();
      },
    };
    await TestBed.configureTestingModule({
      imports: [KiteDashboard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: KiteService, useValue: kite },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(KiteDashboard);
    fixture.detectChanges();
  });

  function openSignals(): void {
    clickButton('Signals');
  }

  function clickButton(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find(item =>
      item.textContent?.replace(/\s+/g, ' ').trim().startsWith(label),
    ) as HTMLButtonElement | undefined;
    expect(button, label).toBeTruthy();
    button!.click();
    fixture.detectChanges();
  }

  function tickers(): string[] {
    return [...fixture.nativeElement.querySelectorAll('.desk__row--signals:not(.desk__row--head) strong')].map(item =>
      item.textContent?.trim(),
    );
  }

  async function finishScan(): Promise<void> {
    await pollStarted;
    jobs.next({ job_id: 'job-1', status: 'done', result: nextResult, error: null });
    fixture.detectChanges();
  }

  it('clears the previous short-term table and sorts every column', async () => {
    const previous = scan([
      row({ rank: 1, ticker: 'WIPRO', company: 'Wipro', close: 400, crossover_date: '2026-09-01' }),
    ]);
    nextResult = scan([
      row({ rank: 2, ticker: 'TCS', company: 'Tata Consultancy', close: 3000, crossover_date: '2026-10-10', short_sma: 40, long_sma: 80, trend_sma: null, trend_bias: null, crossover_type: 'bearish' }),
      row({ rank: 1, ticker: 'INFY', company: 'Infosys', close: 1500, crossover_date: '2026-10-02', short_sma: 20, long_sma: 50, trend_sma: 1400, trend_bias: 'above' }),
    ]);
    fixture.componentInstance.scanResult.set({ short: previous, long: null });
    openSignals();
    expect(tickers()).toEqual(['WIPRO']);

    clickButton('Generate short term');
    expect(tickers()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Loading the official Nifty 100 list');
    expect(fixture.nativeElement.textContent).not.toContain('WIPRO');

    await finishScan();
    expect(tickers()).toEqual(['INFY', 'TCS']);

    clickButton('Close');
    expect(tickers()).toEqual(['INFY', 'TCS']);
    clickButton('Close');
    expect(tickers()).toEqual(['TCS', 'INFY']);

    clickButton('Ticker');
    expect(tickers()).toEqual(['INFY', 'TCS']);
    clickButton('Ticker');
    expect(tickers()).toEqual(['TCS', 'INFY']);

    clickButton('Company');
    expect(tickers()).toEqual(['INFY', 'TCS']);
    clickButton('Crossover Type');
    expect(tickers()).toEqual(['TCS', 'INFY']);
    clickButton('Crossover Date');
    expect(tickers()).toEqual(['INFY', 'TCS']);
    clickButton('EMA 20');
    expect(tickers()).toEqual(['INFY', 'TCS']);
    clickButton('SMA 50');
    expect(tickers()).toEqual(['INFY', 'TCS']);
    clickButton('SMA 200');
    expect(tickers()).toEqual(['INFY', 'TCS']);
    clickButton('SMA 200');
    expect(tickers()).toEqual(['INFY', 'TCS']);
    clickButton('Long-term');
    expect(tickers()).toEqual(['INFY', 'TCS']);

    const headers = [...fixture.nativeElement.querySelectorAll('.desk__sort')] as HTMLButtonElement[];
    expect(headers).toHaveLength(11);
    expect(headers.map(header => header.getAttribute('aria-sort'))).toContain('ascending');
  });

  it('clears the previous long-term table when generate is pressed', async () => {
    const previous = scan([
      row({ rank: 1, ticker: 'RELIANCE', company: 'Reliance', close: 1400 }),
    ], 'price');
    nextResult = scan([
      row({ rank: 2, ticker: 'HDFCBANK', company: 'HDFC Bank', close: 900, long_sma: 880 }),
      row({ rank: 1, ticker: 'SBIN', company: 'State Bank', close: 700, long_sma: 690 }),
    ], 'price');
    fixture.componentInstance.scanResult.set({ short: null, long: previous });
    fixture.componentInstance.activeHorizon.set('long');
    openSignals();
    expect(tickers()).toEqual(['RELIANCE']);

    clickButton('Generate long term');
    expect(tickers()).toEqual([]);
    expect(fixture.nativeElement.textContent).not.toContain('RELIANCE');

    await finishScan();
    expect(tickers()).toEqual(['SBIN', 'HDFCBANK']);
    clickButton('SMA 50');
    expect(tickers()).toEqual(['SBIN', 'HDFCBANK']);
    clickButton('Close');
    expect(tickers()).toEqual(['SBIN', 'HDFCBANK']);

    const headers = [...fixture.nativeElement.querySelectorAll('.desk__sort')] as HTMLButtonElement[];
    expect(headers).toHaveLength(9);
  });
});
