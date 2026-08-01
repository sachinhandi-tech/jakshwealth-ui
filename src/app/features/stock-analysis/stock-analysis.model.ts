export type UniverseSegment = 'midcap' | 'smallcap';

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

export const UNIVERSE_TABS: readonly { id: UniverseSegment; label: string }[] = [
  { id: 'midcap', label: 'Nifty Midcap 150' },
  { id: 'smallcap', label: 'Nifty Smallcap 250' },
];
