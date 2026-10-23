import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

import {
  KiteDeskTab,
  KiteDeskTabItem,
  KiteProfile,
  KiteQuote,
  KiteSignal,
  KiteSignalResult,
  MovingAverageType,
  SignalHorizon,
} from './kite.model';
import { AlgoDeskStore } from './algo-desk.store';
import { AlgoSignals } from './algo-signals';
import { FinalTrades } from './final-trades';
import { GttPlacement } from './gtt-placement';
import { KiteService } from './kite.service';

@Component({
  selector: 'app-kite-dashboard',
  imports: [FormsModule, DatePipe, DecimalPipe, AlgoSignals, FinalTrades, GttPlacement],
  templateUrl: './kite-dashboard.html',
  styleUrl: './kite-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AlgoDeskStore],
})
export class KiteDashboard implements OnDestroy {
  private readonly kite = inject(KiteService);
  private readonly router = inject(Router);

  readonly tabs: KiteDeskTabItem[] = [
    { id: 'user', label: 'User' },
    { id: 'market', label: 'Market' },
    { id: 'signals', label: 'Signals' },
    { id: 'algo', label: 'Algo Signals' },
    { id: 'final', label: 'Final list' },
    { id: 'gtt', label: 'GTT Placement' },
  ];

  readonly activeTab = signal<KiteDeskTab>('user');
  readonly profile = signal<KiteProfile | null>(null);
  readonly quotes = signal<KiteQuote[]>([]);
  readonly profileError = signal<string | null>(null);
  readonly quoteError = signal<string | null>(null);
  readonly profileLoading = signal(true);
  readonly quotesLoading = signal(false);
  readonly scanAllNse = signal(false);
  readonly horizonKinds: SignalHorizon[] = ['short', 'long'];
  readonly activeHorizon = signal<SignalHorizon>('short');
  readonly scanLoading = signal<Record<SignalHorizon, boolean>>({ short: false, long: false });
  readonly scanError = signal<Record<SignalHorizon, string | null>>({ short: null, long: null });
  readonly scanResult = signal<Record<SignalHorizon, KiteSignalResult | null>>({ short: null, long: null });
  private readonly scanPolls = new Map<SignalHorizon, Subscription>();
  readonly sortKey = signal<Record<SignalHorizon, SignalSortKey>>({ short: 'rank', long: 'rank' });
  readonly sortDir = signal<Record<SignalHorizon, 'asc' | 'desc'>>({ short: 'asc', long: 'asc' });

  readonly scans = {
    short: {
      shortType: 'ema' as MovingAverageType,
      shortWindow: 20,
      longType: 'sma' as MovingAverageType,
      longWindow: 50,
      trendWindow: 200,
      lookbackDays: 60,
      maxStocks: 100,
    },
    long: {
      trendWindow: 200,
      lookbackDays: 120,
      maxStocks: 100,
    },
  };

  constructor() {
    this.loadProfile();
    effect(() => {
      const scanAll = this.scanAllNse();
      const maxStocks = scanAll ? 3080 : 100;
      this.scans.short.maxStocks = maxStocks;
      this.scans.long.maxStocks = maxStocks;
    });
  }

  ngOnDestroy(): void {
    for (const poll of this.scanPolls.values()) {
      poll.unsubscribe();
    }
  }

  selectTab(tab: KiteDeskTab): void {
    this.activeTab.set(tab);
    if (tab === 'market' && this.quotes().length === 0 && !this.quotesLoading()) {
      this.loadQuotes();
    }
  }

  loadQuotes(): void {
    this.quotesLoading.set(true);
    this.quoteError.set(null);
    this.kite.quotes().subscribe({
      next: rows => {
        this.quotes.set(rows);
        this.quotesLoading.set(false);
      },
      error: err => {
        this.quotesLoading.set(false);
        this.quoteError.set(readError(err));
      },
    });
  }

  private shortTermRequest() {
    const form = this.scans.short;
    if (Number(form.longWindow) <= Number(form.shortWindow)) {
      this.scanError.update(current => ({
        ...current,
        short: 'The slow period must be greater than the fast period.',
      }));
      return null;
    }
    return {
      scan_mode: 'crossover' as const,
      ma_type: form.shortType,
      short_type: form.shortType,
      long_type: form.longType,
      short_window: Number(form.shortWindow),
      long_window: Number(form.longWindow),
      trend_window: Number(form.trendWindow),
      lookback_days: Number(form.lookbackDays),
      max_stocks: Number(form.maxStocks),
      scan_all_nse: this.scanAllNse(),
    };
  }

  private longTermRequest() {
    const form = this.scans.long;
    return {
      scan_mode: 'price' as const,
      ma_type: 'sma' as const,
      short_type: 'sma' as const,
      long_type: 'sma' as const,
      short_window: 2,
      long_window: Number(form.trendWindow),
      trend_window: Number(form.trendWindow),
      lookback_days: Number(form.lookbackDays),
      max_stocks: Number(form.maxStocks),
      scan_all_nse: this.scanAllNse(),
    };
  }

  generateSignals(kind: SignalHorizon): void {
    const request = kind === 'short' ? this.shortTermRequest() : this.longTermRequest();
    if (!request) {
      return;
    }
    this.scanPolls.get(kind)?.unsubscribe();
    this.scanResult.update(current => ({ ...current, [kind]: null }));
    this.scanLoading.update(current => ({ ...current, [kind]: true }));
    this.scanError.update(current => ({ ...current, [kind]: null }));
    this.kite.startScan(request).subscribe({
      next: job => {
        const poll = timer(0, 2000).pipe(
          switchMap(() => this.kite.signalJob(job.job_id)),
          takeWhile(item => item.status === 'running', true),
        ).subscribe({
          next: item => {
            if (item.status === 'running') {
              return;
            }
            this.scanLoading.update(current => ({ ...current, [kind]: false }));
            if (item.status === 'done' && item.result) {
              this.scanResult.update(current => ({ ...current, [kind]: item.result }));
              return;
            }
            this.scanError.update(current => ({
              ...current,
              [kind]: item.error || 'The scan could not be completed.',
            }));
          },
          error: err => this.failScan(kind, err),
        });
        this.scanPolls.set(kind, poll);
      },
      error: err => this.failScan(kind, err),
    });
  }

  private failScan(kind: SignalHorizon, err: { error?: { detail?: unknown }; status?: number }): void {
    this.scanLoading.update(current => ({ ...current, [kind]: false }));
    this.scanError.update(current => ({ ...current, [kind]: readError(err) }));
    if (err?.status === 401) {
      void this.router.navigate(['/kite/login']);
    }
  }

  signalColumns(kind: SignalHorizon, result: KiteSignalResult): { key: SignalSortKey; label: string }[] {
    const shared: { key: SignalSortKey; label: string }[] = [
      { key: 'rank', label: 'Rank' },
      { key: 'ticker', label: 'Ticker' },
      { key: 'company', label: 'Company' },
      { key: 'crossover_type', label: 'Crossover Type' },
      { key: 'crossover_date', label: 'Crossover Date' },
      { key: 'close', label: 'Close' },
    ];
    if (kind === 'short') {
      return [
        ...shared,
        { key: 'short_sma', label: `${this.averageName(result.short_type)} ${result.short_window}` },
        { key: 'long_sma', label: `${this.averageName(result.long_type)} ${result.long_window}` },
        { key: 'trend_sma', label: `SMA ${result.trend_window}` },
        { key: 'trend_bias', label: 'Long-term' },
        { key: 'reason', label: 'Reason' },
      ];
    }
    return [
      ...shared,
      { key: 'long_sma', label: `SMA ${result.long_window}` },
      { key: 'trend_bias', label: 'Long-term' },
      { key: 'reason', label: 'Reason' },
    ];
  }

  toggleSort(kind: SignalHorizon, key: SignalSortKey): void {
    if (this.sortKey()[kind] === key) {
      this.sortDir.update(current => ({ ...current, [kind]: current[kind] === 'asc' ? 'desc' : 'asc' }));
      return;
    }
    this.sortKey.update(current => ({ ...current, [kind]: key }));
    this.sortDir.update(current => ({ ...current, [kind]: 'asc' }));
  }

  sortedSignals(kind: SignalHorizon): KiteSignal[] {
    const rows = this.scanResult()[kind]?.signals ?? [];
    const key = this.sortKey()[kind];
    const direction = this.sortDir()[kind] === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => compareSignals(left, right, key, direction));
  }

  horizonName(kind: SignalHorizon): string {
    return kind === 'short' ? 'Short term' : 'Long term';
  }

  averageName(maType: string): string {
    if (maType === 'ema') {
      return 'EMA';
    }
    if (maType === 'wma') {
      return 'WMA';
    }
    return 'SMA';
  }

  logout(): void {
    this.kite.logout().subscribe({
      next: () => void this.router.navigate(['/kite/login']),
      error: () => void this.router.navigate(['/kite/login']),
    });
  }

  navigateToSubscription(): void {
    this.router.navigate(['/settings/subscription']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  navigateToBilling(): void {
    this.router.navigate(['/admin/billing']);
  }

  private loadProfile(): void {
    this.profileLoading.set(true);
    this.kite.profile().subscribe({
      next: profile => {
        this.profile.set(profile);
        this.profileLoading.set(false);
      },
      error: err => {
        this.profileLoading.set(false);
        const message = readError(err);
        this.profileError.set(message);
        if (err?.status === 401) {
          void this.router.navigate(['/kite/login']);
        }
      },
    });
  }
}

type SignalSortKey = 'rank' | 'ticker' | 'company' | 'crossover_type' | 'crossover_date' | 'close' | 'short_sma' | 'long_sma' | 'trend_sma' | 'trend_bias' | 'reason';

function compareSignals(left: KiteSignal, right: KiteSignal, key: SignalSortKey, direction: number): number {
  const leftValue = signalValue(left, key);
  const rightValue = signalValue(right, key);
  if (leftValue === null || rightValue === null) {
    if (leftValue === rightValue) {
      return left.ticker.localeCompare(right.ticker);
    }
    return leftValue === null ? 1 : -1;
  }
  const compared = typeof leftValue === 'number' && typeof rightValue === 'number'
    ? leftValue - rightValue
    : String(leftValue).localeCompare(String(rightValue));
  if (compared === 0) {
    return left.ticker.localeCompare(right.ticker);
  }
  return direction * compared;
}

function signalValue(row: KiteSignal, key: SignalSortKey): string | number | null {
  if (key === 'crossover_date') {
    return row.crossover_date;
  }
  return row[key];
}

function readError(err: { error?: { detail?: unknown }; status?: number }): string {
  const detail = err?.error?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return 'The Kite API could not complete that request.';
}
