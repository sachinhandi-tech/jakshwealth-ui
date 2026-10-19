export const VOLUME_LOOKBACK = 20;
export const VOLUME_MULTIPLIER = 3;
export const PRICE_LOOKBACK = 20;
export const MAX_BREAKOUT_AGE = 20;
export const MIDPOINT_TOLERANCE = 1;

export interface ScannerCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScannerStock {
  symbol: string;
  companyName: string;
  instrumentToken: number | null;
  niftyFlags: Record<string, boolean>;
  candles: ScannerCandle[];
}

export interface BreakoutSetup {
  symbol: string;
  companyName: string;
  instrumentToken: number | null;
  currentPrice: number;
  breakoutDate: string;
  bIndex: number;
  daysSince: number;
  breakoutLow: number;
  breakoutHigh: number;
  midpoint: number;
  distanceFromMidpoint: number;
  volMultiple: number;
  prevHigh: number;
  maxPriceAfter: number;
  returnFromCloseToSubHigh: number;
  retracementHigh: number;
  candles: ScannerCandle[];
}

export function readStocks(payload: unknown): ScannerStock[] {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { stocks?: unknown }).stocks)) {
    throw new Error('The scanner cache could not be read.');
  }
  const stocks: ScannerStock[] = [];
  for (const item of (payload as { stocks: unknown[] }).stocks) {
    const stock = readStock(item);
    if (stock) {
      stocks.push(stock);
    }
  }
  return stocks;
}

export function scanBreakouts(stocks: ScannerStock[]): { scanned: number; setups: BreakoutSetup[] } {
  const setups: BreakoutSetup[] = [];
  for (const stock of stocks) {
    const setup = scanStock(stock);
    if (setup) {
      setups.push(setup);
    }
  }
  setups.sort((left, right) =>
    left.daysSince - right.daysSince
    || Math.abs(left.distanceFromMidpoint) - Math.abs(right.distanceFromMidpoint),
  );
  return { scanned: stocks.length, setups };
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function scanStock(stock: ScannerStock): BreakoutSetup | null {
  const candles = stock.candles;
  if (candles.length < PRICE_LOOKBACK + 5) {
    return null;
  }
  const latestIndex = candles.length - 1;
  const earliest = Math.max(VOLUME_LOOKBACK, PRICE_LOOKBACK, latestIndex - MAX_BREAKOUT_AGE);
  for (let index = latestIndex - 1; index >= earliest; index -= 1) {
    const setup = acceptBreakout(stock, candles, index);
    if (setup) {
      return setup;
    }
  }
  return null;
}

function acceptBreakout(stock: ScannerStock, candles: ScannerCandle[], index: number): BreakoutSetup | null {
  const candidate = candles[index];
  const volumeWindow = candles.slice(index - VOLUME_LOOKBACK, index);
  const priceWindow = candles.slice(index - PRICE_LOOKBACK, index);
  if (volumeWindow.length < VOLUME_LOOKBACK || priceWindow.length < PRICE_LOOKBACK) {
    return null;
  }
  const averageVolume = volumeWindow.reduce((sum, candle) => sum + candle.volume, 0) / volumeWindow.length;
  if (!Number.isFinite(averageVolume) || averageVolume <= 0) {
    return null;
  }
  const prevHigh = Math.max(...priceWindow.map(candle => candle.high));
  if (!(candidate.close > candidate.open)) {
    return null;
  }
  if (candidate.volume < averageVolume * VOLUME_MULTIPLIER) {
    return null;
  }
  if (!(candidate.close > prevHigh)) {
    return null;
  }
  const after = candles.slice(index + 1);
  const maxPriceAfter = Math.max(...after.map(candle => candle.high));
  if (!(maxPriceAfter > candidate.high)) {
    return null;
  }
  const midpoint = (candidate.high + candidate.low) / 2;
  if (!(midpoint > 0)) {
    return null;
  }
  const currentPrice = candles[candles.length - 1].close;
  const distanceFromMidpoint = ((currentPrice - midpoint) / midpoint) * 100;
  const daysSince = candles.length - 1 - index;
  if (Math.abs(distanceFromMidpoint) > MIDPOINT_TOLERANCE || daysSince > MAX_BREAKOUT_AGE) {
    return null;
  }
  const breakoutClose = candidate.close;
  return {
    symbol: stock.symbol,
    companyName: stock.companyName,
    instrumentToken: stock.instrumentToken,
    currentPrice,
    breakoutDate: candidate.date,
    bIndex: index,
    daysSince,
    breakoutLow: candidate.low,
    breakoutHigh: candidate.high,
    midpoint,
    distanceFromMidpoint,
    volMultiple: candidate.volume / averageVolume,
    prevHigh,
    maxPriceAfter,
    returnFromCloseToSubHigh: ((maxPriceAfter - breakoutClose) / breakoutClose) * 100,
    retracementHigh: ((maxPriceAfter - currentPrice) / maxPriceAfter) * 100,
    candles,
  };
}

function readStock(item: unknown): ScannerStock | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const symbol = text(row['symbol'] ?? row['ticker']);
  if (!symbol) {
    return null;
  }
  const companyName = text(row['company_name'] ?? row['companyName'] ?? row['company']) || symbol;
  const token = asNumber(row['instrument_token'] ?? row['instrumentToken']);
  const flags = row['nifty_flags'] ?? row['niftyFlags'];
  const candles = normalizeCandles(Array.isArray(row['candles']) ? row['candles'] : []);
  return {
    symbol,
    companyName,
    instrumentToken: token,
    niftyFlags: normalizeFlags(flags),
    candles,
  };
}

export function normalizeCandles(raw: unknown[]): ScannerCandle[] {
  const candles: ScannerCandle[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const date = formatCandleDate(row['date'] ?? row['time'] ?? row['timestamp']);
    const open = asNumber(row['open']);
    const high = asNumber(row['high']);
    const low = asNumber(row['low']);
    const close = asNumber(row['close']);
    const volume = asNumber(row['volume']);
    if (!date || open === null || high === null || low === null || close === null || volume === null) {
      continue;
    }
    candles.push({ date, open, high, low, close, volume });
  }
  candles.sort((left, right) => left.date.localeCompare(right.date));
  return candles;
}

function formatCandleDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const textValue = text(value);
  if (!textValue) {
    return null;
  }
  const prefix = /^(\d{4}-\d{2}-\d{2})/.exec(textValue);
  if (prefix) {
    return prefix[1];
  }
  const parsed = new Date(textValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

function normalizeFlags(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const flags: Record<string, boolean> = {};
  for (const [key, flag] of Object.entries(value as Record<string, unknown>)) {
    flags[key] = flag === true || flag === 'true' || flag === 1;
  }
  return flags;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}
