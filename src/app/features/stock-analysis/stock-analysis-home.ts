import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ASYNC_SCAN_MAX_WORKERS,
  DEFAULT_MIN_SCORE,
  parseCustomSymbols,
  ScanJobStatus,
  StockScanRow,
  UNIVERSE_TABS,
  UniverseSegment,
} from './stock-analysis.model';
import { StockAnalysisService } from './services/stock-analysis.service';

@Component({
  selector: 'app-stock-analysis-home',
  imports: [FormsModule],
  templateUrl: './stock-analysis-home.html',
  styleUrl: './stock-analysis-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockAnalysisHome {
  private readonly stockAnalysis = inject(StockAnalysisService);

  readonly tabs = UNIVERSE_TABS;
  readonly activeSegment = signal<UniverseSegment>('midcap');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly universeLabel = signal('Loading universe…');
  readonly universeSymbolCount = signal(0);
  readonly results = signal<StockScanRow[]>([]);
  readonly scannedCount = signal(0);
  readonly finalSignalCount = signal(0);
  readonly rankedCount = signal(0);
  readonly hasScanned = signal(false);
  readonly scanStatus = signal<ScanJobStatus | null>(null);
  readonly progressCompleted = signal(0);
  readonly progressTotal = signal(0);

  minScore = DEFAULT_MIN_SCORE;
  strictRsi30 = true;
  customSymbolsText = '';

  constructor() {
    this.loadUniverse('midcap');
  }

  selectSegment(segment: UniverseSegment): void {
    if (this.activeSegment() === segment) {
      return;
    }
    this.activeSegment.set(segment);
    this.results.set([]);
    this.hasScanned.set(false);
    this.error.set(null);
    this.resetProgress();
    this.loadUniverse(segment);
  }

  runScan(): void {
    this.loading.set(true);
    this.error.set(null);
    this.resetProgress();
    this.scanStatus.set('pending');

    const segment = this.activeSegment();
    const customSymbols =
      segment === 'custom' ? parseCustomSymbols(this.customSymbolsText) : undefined;

    if (segment === 'custom' && !customSymbols?.length) {
      this.error.set('Enter at least one NSE symbol (e.g. RELIANCE, TCS).');
      this.loading.set(false);
      this.scanStatus.set(null);
      return;
    }

    if (segment !== 'custom') {
      this.progressTotal.set(this.universeSymbolCount());
    } else {
      this.progressTotal.set(customSymbols?.length ?? 0);
    }

    this.stockAnalysis
      .runScanAsync({
        universeSegment: segment,
        symbols: customSymbols,
        minScore: this.minScore,
        strictRsi30: this.strictRsi30,
        sleep: 0,
        maxWorkers: ASYNC_SCAN_MAX_WORKERS,
      })
      .subscribe({
        next: job => {
          this.scanStatus.set(job.status);
          this.progressCompleted.set(job.progress?.completed ?? 0);
          this.progressTotal.set(job.progress?.total ?? this.progressTotal());

          if (job.status === 'failed') {
            this.error.set(job.error ?? 'Scan job failed.');
            this.loading.set(false);
            return;
          }

          if (job.status !== 'complete') {
            return;
          }

          this.results.set(job.rankedCandidates ?? []);
          this.scannedCount.set(job.scannedCount ?? 0);
          this.finalSignalCount.set(job.finalSignalCount ?? 0);
          this.rankedCount.set(job.rankedCandidateCount ?? 0);
          this.hasScanned.set(true);
          this.loading.set(false);
        },
        error: err => {
          this.error.set(err?.message ?? err?.error?.message ?? 'Scan failed. Check that the API is running.');
          this.scanStatus.set('failed');
          this.loading.set(false);
        },
      });
  }

  progressPercent(): number {
    const total = this.progressTotal();
    if (!total) return 0;
    return Math.min(100, Math.round((this.progressCompleted() / total) * 100));
  }

  scanStatusLabel(): string {
    switch (this.scanStatus()) {
      case 'pending':
        return 'Starting scan…';
      case 'running':
        return `Scanning ${this.progressCompleted()} / ${this.progressTotal()} symbols…`;
      case 'complete':
        return 'Scan complete';
      case 'failed':
        return 'Scan failed';
      default:
        return '';
    }
  }

  scoreClass(score: number | undefined): string {
    if (score == null) return 'score--none';
    if (score >= 90) return 'score--hot';
    if (score >= 80) return 'score--good';
    if (score >= 70) return 'score--fair';
    return 'score--low';
  }

  scoreWidth(score: number | undefined): string {
    if (score == null) return '0%';
    return `${Math.min(score, 100)}%`;
  }

  signalLabel(row: StockScanRow): string {
    if (row.Final_Signal) return 'BUY';
    if (row.Near_Setup_Within_5pct) return 'WATCH';
    return '—';
  }

  signalClass(row: StockScanRow): string {
    if (row.Final_Signal) return 'jw-badge--buy';
    if (row.Near_Setup_Within_5pct) return 'jw-badge--watch';
    return 'jw-badge--neutral';
  }

  formatPrice(value: number | undefined): string {
    if (value == null) return '—';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatPct(value: number | undefined): string {
    if (value == null) return '—';
    return `${value.toFixed(2)}%`;
  }

  customSymbolCount(): number {
    return parseCustomSymbols(this.customSymbolsText).length;
  }

  private resetProgress(): void {
    this.progressCompleted.set(0);
    this.progressTotal.set(0);
    this.scanStatus.set(null);
  }

  private loadUniverse(segment: UniverseSegment): void {
    if (segment === 'custom') {
      this.universeSymbolCount.set(0);
      this.universeLabel.set('Custom watchlist · enter NSE symbols below');
      return;
    }

    this.universeLabel.set('Loading universe…');
    this.stockAnalysis.getUniverse(segment).subscribe({
      next: universe => {
        this.universeSymbolCount.set(universe.symbolCount);
        this.universeLabel.set(
          `${universe.label} · ${universe.symbolCount} symbols · ${universe.source}`,
        );
      },
      error: () => this.universeLabel.set('Universe unavailable for this segment.'),
    });
  }
}
