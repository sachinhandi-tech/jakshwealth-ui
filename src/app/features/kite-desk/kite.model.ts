export interface KiteSessionStatus {
  authenticated: boolean;
  user_name: string | null;
  user_id: string | null;
}

export interface KiteLoginRequest {
  api_key: string;
  api_secret: string;
  request_token: string;
}

export interface KiteProfile {
  user_name: string;
  user_id: string;
  products: string[];
  exchanges: string[];
}

export interface KiteQuote {
  symbol: string;
  exchange: string;
  last_price: number | null;
  change_percent: number | null;
  volume: number | null;
}

export type MovingAverageType = 'sma' | 'ema' | 'wma';
export type SignalHorizon = 'short' | 'long';

export interface KiteSignalRequest {
  scan_mode: 'crossover' | 'price';
  ma_type: MovingAverageType;
  short_type: MovingAverageType;
  long_type: MovingAverageType;
  short_window: number;
  long_window: number;
  trend_window: number;
  lookback_days: number;
  max_stocks: number;
}

export interface KiteSignal {
  rank: number;
  ticker: string;
  company: string;
  crossover_type: 'bullish' | 'bearish';
  crossover_date: string;
  close: number;
  short_sma: number;
  long_sma: number;
  trend_sma: number | null;
  trend_bias: 'above' | 'below' | null;
}

export interface KiteSignalJob {
  job_id: string;
  status: 'running' | 'done' | 'error';
  result: KiteSignalResult | null;
  error: string | null;
}

export interface KiteSignalResult {
  scan_mode: 'crossover' | 'price';
  ma_type: MovingAverageType;
  short_type: MovingAverageType;
  long_type: MovingAverageType;
  trend_window: number;
  short_window: number;
  long_window: number;
  lookback_days: number;
  universe: number;
  scanned: number;
  skipped: number;
  signals: KiteSignal[];
}

export type KiteDeskTab = 'user' | 'market' | 'signals';

export interface KiteDeskTabItem {
  id: KiteDeskTab;
  label: string;
}
