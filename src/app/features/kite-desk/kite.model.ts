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

export interface UnivestSignal {
  symbol: string;
  transaction_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number | null;
  target: number | null;
  source: 'univest';
  product?: 'CNC' | 'MIS' | 'NRML' | null;
  targets?: number[];
  signal_kind?: 'entry' | 'partial_book' | 'exit';
  entry_low?: number;
  entry_high?: number;
}

export interface UnivestAttempt {
  received_at: string;
  accepted: boolean;
  error: string | null;
  preview: string;
  payload: UnivestSignal | null;
}

export interface UnivestOrder {
  placed: boolean;
  orders: {
    exchange: string;
    tradingsymbol: string;
    transaction_type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    order_id?: string | null;
  }[];
  error?: string | null;
}

export interface UnivestParseResponse {
  accepted: boolean;
  error?: string | null;
  payload: (UnivestSignal & { order?: UnivestOrder }) | null;
  dispatched: boolean;
  dispatch_error?: string | null;
}

export type KiteDeskTab = 'user' | 'market' | 'signals' | 'univest';

export interface KiteDeskTabItem {
  id: KiteDeskTab;
  label: string;
}
