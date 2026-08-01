import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  API_GATEWAY_SYMBOL_LIMIT_MAX,
  DEFAULT_MIN_SCORE,
  DEFAULT_SYMBOL_LIMIT,
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
  readonly results = signal<StockScanRow[]>([]);
  readonly scannedCount = signal(0);
  readonly finalSignalCount = signal(0);
  readonly rankedCount = signal(0);
  readonly hasScanned = signal(false);

  readonly symbolLimitMax = API_GATEWAY_SYMBOL_LIMIT_MAX;

  minScore = DEFAULT_MIN_SCORE;
  strictRsi30 = true;
  symbolLimit = DEFAULT_SYMBOL_LIMIT;

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
    this.loadUniverse(segment);
  }

  runScan(): void {
    this.loading.set(true);
    this.error.set(null);

    const segment = this.activeSegment();
    this.stockAnalysis
      .runScan({
        universeSegment: segment,
        symbolLimit: this.symbolLimit,
        minScore: this.minScore,
        strictRsi30: this.strictRsi30,
        sleep: 0,
        maxWorkers: 8,
      })
      .subscribe({
        next: response => {
          this.results.set(response.rankedCandidates);
          this.scannedCount.set(response.scannedCount);
          this.finalSignalCount.set(response.finalSignalCount);
          this.rankedCount.set(response.rankedCandidateCount);
          this.hasScanned.set(true);
          this.loading.set(false);
        },
        error: err => {
          const status = err?.status;
          if (status === 504) {
            this.error.set(
              'Scan timed out (API Gateway ~29s limit). Lower symbol limit (try 20–30) and run again.',
            );
          } else {
            this.error.set(err?.error?.message ?? 'Scan failed. Check that the API is running.');
          }
          this.loading.set(false);
        },
      });
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

  private loadUniverse(segment: UniverseSegment): void {
    this.universeLabel.set('Loading universe…');
    this.stockAnalysis.getUniverse(segment).subscribe({
      next: universe =>
        this.universeLabel.set(
          `${universe.label} · ${universe.symbolCount} symbols · ${universe.source}`,
        ),
      error: () => this.universeLabel.set('Universe unavailable for this segment.'),
    });
  }
}
