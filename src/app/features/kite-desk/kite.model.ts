export interface KiteSessionStatus {
  authenticated: boolean;
  user_name: string | null;
  user_id: string | null;
  platform_user_id?: string | null;
}

export interface KiteSubscriber {
  platform_user_id: string;
  email: string;
}

export interface KiteLoginRequest {
  api_key: string;
  request_token: string;
  platform_user_id?: string;
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
  reason: string;
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

export interface OhlcQuote {
  symbol: string;
  last_price: number | null;
}

export interface OhlcSnapshot {
  quotes: OhlcQuote[];
}

export interface GttOrderRequest {
  symbol: string;
  exchange?: string;
  quantity: number;
  buy_price: number | null;
  stoploss: number | null;
  last_price: number | null;
}

export interface AlgoSetupRow {
  symbol: string;
  exchange?: string;
  ai_decision?: string | null;
  ai_reason?: string | null;
  gtt_tradable?: boolean;
  entry?: number;
  stop?: number;
  target?: number;
  last_close?: number;
  quantity?: number | null;
  quantity_basis?: string;
  segment?: string;
  reason?: string;
}

export interface FinalActivity {
  text: string;
  state?: string;
}

export interface AlgoSetupResult {
  scanned: number;
  accepted: number;
  setups: AlgoSetupRow[];
  sell_calls?: AlgoSetupRow[];
  universe_note?: string;
  working?: boolean;
  paused?: boolean;
  activity?: FinalActivity[];
}

export interface GttOrderResult {
  symbol: string;
  quantity: number;
  buy_price: number | null;
  stoploss: number | null;
  tick_size: number | null;
  last_price: number | null;
  account_state: string;
  position_quantity: number;
  active_buy_trigger_id: string | null;
  active_stoploss_trigger_id: string | null;
  day_buy_order_id: string | null;
  day_buy_order_status: string | null;
  buy_status: string;
  buy_trigger_id: string | null;
  stoploss_status: string;
  stoploss_trigger_id: string | null;
  message: string;
}

export interface GttOrderResponse {
  orders: GttOrderResult[];
}

export type KiteDeskTab = 'user' | 'market' | 'signals' | 'algo' | 'final' | 'gtt';

export interface KiteDeskTabItem {
  id: KiteDeskTab;
  label: string;
}
