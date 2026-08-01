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

export interface StockUniverseResponse {
  segment: UniverseSegment;
  label: string;
  source: string;
  symbolCount: number;
  sampleSymbols: string[];
}

export const DEFAULT_MIN_SCORE = 80;
export const DEFAULT_SYMBOL_LIMIT = 30;
/** API Gateway sync timeout is ~29s — keep scans under this size. */
export const API_GATEWAY_SYMBOL_LIMIT_MAX = 120;
/** Recommended max for custom watchlists (parallel scan budget). */
export const CUSTOM_SYMBOL_LIMIT_MAX = 30;

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
