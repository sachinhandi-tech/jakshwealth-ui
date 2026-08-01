export type UniverseSegment = 'midcap' | 'smallcap' | 'custom';

export interface StockScanRequest {
  symbols?: string[];
  symbolLimit?: number;
  minScore?: number;
  strictRsi30?: boolean;
  universeSegment?: UniverseSegment;
  sleep?: number;
  maxWorkers?: number;
}

export interface StockScanRow {
  Symbol: string;
  Scan_Status: string;
  Final_Signal?: boolean;
  Near_Setup_Within_5pct?: boolean;
  Score?: number;
  Close?: number;
  Current_HH?: number;
  Distance_To_Breakout_pct?: number;
  RSI14?: number;
  RSI_Valid?: boolean;
}

export interface StockScanResponse {
  scannedCount: number;
  universeSegment?: UniverseSegment;
  minScore: number;
  strictRsi30?: boolean;
  results: StockScanRow[];
  finalSignals: StockScanRow[];
  rankedCandidates: StockScanRow[];
  finalSignalCount: number;
  rankedCandidateCount: number;
}

export type ScanJobStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface StockScanJobResponse extends Partial<StockScanResponse> {
  jobId: string;
  status: ScanJobStatus;
  progress: { total: number; completed: number };
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockUniverseResponse {
  segment: UniverseSegment;
  label: string;
  source: string;
  symbolCount: number;
  sampleSymbols: string[];
}

export const DEFAULT_MIN_SCORE = 80;
/** Scans run asynchronously — full index universes are supported. */
export const ASYNC_SCAN_MAX_WORKERS = 12;

export const UNIVERSE_TABS: readonly { id: UniverseSegment; label: string }[] = [
  { id: 'midcap', label: 'Nifty Midcap 150' },
  { id: 'smallcap', label: 'Nifty Smallcap 250' },
  { id: 'custom', label: 'Custom' },
];

/** Parse comma/newline/space-separated NSE tickers for custom scans. */
export function parseCustomSymbols(text: string): string[] {
  const seen = new Set<string>();
  const symbols: string[] = [];
  for (const part of text.split(/[\s,;]+/)) {
    let symbol = part.trim().toUpperCase();
    if (!symbol) continue;
    symbol = symbol.replace(/^NSE:/i, '').replace(/\.NS$/i, '');
    if (!seen.has(symbol)) {
      seen.add(symbol);
      symbols.push(symbol);
    }
  }
  return symbols;
}
