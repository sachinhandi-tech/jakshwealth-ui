import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DEFAULT_MIN_SCORE, StockScanRow } from './stock-analysis.model';
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

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly universeLabel = signal('Loading universe…');
  readonly results = signal<StockScanRow[]>([]);
  readonly scannedCount = signal(0);
  readonly finalSignalCount = signal(0);
  readonly rankedCount = signal(0);
  readonly hasScanned = signal(false);

  symbolsInput = '';
  minScore = DEFAULT_MIN_SCORE;
  strictRsi30 = true;
  useUniverse = true;
  symbolLimit = 20;

  constructor() {
    this.stockAnalysis.getUniverse().subscribe({
      next: universe =>
        this.universeLabel.set(
          `${universe.symbolCount} symbols · ${universe.source} · e.g. ${universe.sampleSymbols.slice(0, 3).join(', ')}`,
        ),
      error: () => this.universeLabel.set('Universe unavailable — enter symbols manually.'),
    });
  }

  runScan(): void {
    this.loading.set(true);
    this.error.set(null);

    const request = this.buildRequest();
    this.stockAnalysis.runScan(request).subscribe({
      next: response => {
        this.results.set(response.rankedCandidates.length ? response.rankedCandidates : response.results);
        this.scannedCount.set(response.scannedCount);
        this.finalSignalCount.set(response.finalSignalCount);
        this.rankedCount.set(response.rankedCandidateCount);
        this.hasScanned.set(true);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Scan failed. Check that the API is running.');
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

  private buildRequest() {
    if (this.useUniverse) {
      return {
        symbolLimit: this.symbolLimit,
        minScore: this.minScore,
        strictRsi30: this.strictRsi30,
      };
    }

    const symbols = this.symbolsInput
      .split(/[\s,]+/)
      .map(symbol => symbol.trim())
      .filter(Boolean);

    return { symbols, minScore: this.minScore, strictRsi30: this.strictRsi30 };
  }
}
