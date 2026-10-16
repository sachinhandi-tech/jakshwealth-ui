import { DatePipe, DecimalPipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  KiteDeskTab,
  KiteDeskTabItem,
  KiteProfile,
  KiteQuote,
  KiteSignalResult,
  MovingAverageType,
  SignalHorizon,
  UnivestAttempt,
  UnivestParseResponse,
} from './kite.model';
import { KiteService } from './kite.service';

@Component({
  selector: 'app-kite-dashboard',
  imports: [FormsModule, DatePipe, DecimalPipe, JsonPipe],
  templateUrl: './kite-dashboard.html',
  styleUrl: './kite-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KiteDashboard implements OnDestroy {
  private readonly kite = inject(KiteService);
  private readonly router = inject(Router);

  readonly tabs: KiteDeskTabItem[] = [
    { id: 'user', label: 'User' },
    { id: 'market', label: 'Market' },
    { id: 'signals', label: 'Signals' },
    { id: 'univest', label: 'Univest' },
  ];

  readonly activeTab = signal<KiteDeskTab>('user');
  readonly profile = signal<KiteProfile | null>(null);
  readonly quotes = signal<KiteQuote[]>([]);
  readonly profileError = signal<string | null>(null);
  readonly quoteError = signal<string | null>(null);
  readonly profileLoading = signal(true);
  readonly quotesLoading = signal(false);
  readonly horizonKinds: SignalHorizon[] = ['short', 'long'];
  readonly activeHorizon = signal<SignalHorizon>('short');
  readonly scanLoading = signal<Record<SignalHorizon, boolean>>({ short: false, long: false });
  readonly scanError = signal<Record<SignalHorizon, string | null>>({ short: null, long: null });
  readonly scanResult = signal<Record<SignalHorizon, KiteSignalResult | null>>({ short: null, long: null });
  readonly univestLoading = signal(false);
  readonly univestError = signal<string | null>(null);
  readonly univestResult = signal<UnivestParseResponse | null>(null);
  readonly univestAttempts = signal<UnivestAttempt[]>([]);

  univestText = '';
  private univestTimer: ReturnType<typeof setInterval> | null = null;

  readonly scans = {
    short: {
      shortType: 'ema' as MovingAverageType,
      shortWindow: 20,
      longType: 'sma' as MovingAverageType,
      longWindow: 50,
      trendWindow: 200,
      lookbackDays: 60,
      maxStocks: 25,
    },
    long: {
      trendWindow: 200,
      lookbackDays: 120,
      maxStocks: 25,
    },
  };

  constructor() {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.stopUnivestPoll();
  }

  selectTab(tab: KiteDeskTab): void {
    this.activeTab.set(tab);
    if (tab === 'market' && this.quotes().length === 0 && !this.quotesLoading()) {
      this.loadQuotes();
    }
    if (tab === 'univest') {
      this.refreshUnivest();
      this.univestTimer ??= setInterval(() => this.refreshUnivest(), 4000);
      return;
    }
    this.stopUnivestPoll();
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
    };
  }

  generateSignals(kind: SignalHorizon): void {
    const request = kind === 'short' ? this.shortTermRequest() : this.longTermRequest();
    if (!request) {
      return;
    }
    this.scanLoading.update(current => ({ ...current, [kind]: true }));
    this.scanError.update(current => ({ ...current, [kind]: null }));
    this.kite
      .signals(request)
      .subscribe({
        next: result => {
          this.scanResult.update(current => ({ ...current, [kind]: result }));
          this.scanLoading.update(current => ({ ...current, [kind]: false }));
        },
        error: err => {
          this.scanLoading.update(current => ({ ...current, [kind]: false }));
          this.scanError.update(current => ({ ...current, [kind]: readError(err) }));
          if (err?.status === 401) {
            void this.router.navigate(['/kite/login']);
          }
        },
      });
  }

  refreshUnivest(): void {
    this.kite.univestAttempts().subscribe({
      next: rows => this.univestAttempts.set(rows),
    });
  }

  parseUnivest(): void {
    const text = this.univestText.trim();
    if (!text) {
      this.univestError.set('Paste a Univest notification first.');
      return;
    }
    this.univestLoading.set(true);
    this.univestError.set(null);
    this.kite.parseUnivest(text).subscribe({
      next: result => {
        this.univestResult.set(result);
        this.univestLoading.set(false);
        if (!result.accepted) {
          this.univestError.set(result.error || 'That notification could not be parsed.');
        }
      },
      error: err => {
        this.univestLoading.set(false);
        this.univestError.set(readError(err));
      },
    });
  }

  private stopUnivestPoll(): void {
    if (this.univestTimer !== null) {
      clearInterval(this.univestTimer);
      this.univestTimer = null;
    }
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

function readError(err: { error?: { detail?: unknown }; status?: number }): string {
  const detail = err?.error?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return 'The Kite API could not complete that request.';
}
