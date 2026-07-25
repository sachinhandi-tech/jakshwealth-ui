export interface StockScanRequest {
  symbols?: string[];
  symbolLimit?: number;
  minScore?: number;
  strictRsi30?: boolean;
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
}

export interface StockScanResponse {
  scannedCount: number;
  minScore: number;
  results: StockScanRow[];
  finalSignals: StockScanRow[];
  rankedCandidates: StockScanRow[];
  finalSignalCount: number;
  rankedCandidateCount: number;
}

export interface StockUniverseResponse {
  source: string;
  symbolCount: number;
  sampleSymbols: string[];
}

export const DEFAULT_MIN_SCORE = 80;
