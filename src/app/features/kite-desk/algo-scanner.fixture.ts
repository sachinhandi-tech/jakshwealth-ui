import { ScannerCandle, ScannerStock } from './algo-scanner';

export function day(index: number): string {
  const date = new Date(Date.UTC(2026, 0, 1 + index));
  return date.toISOString().slice(0, 10);
}

export function candle(index: number, overrides: Partial<ScannerCandle> = {}): ScannerCandle {
  return {
    date: day(index),
    open: 100,
    high: 101,
    low: 99,
    close: 100,
    volume: 1000,
    ...overrides,
  };
}

export function history(count: number): ScannerCandle[] {
  return Array.from({ length: count }, (_, index) => candle(index));
}

export function withBreakout(candles: ScannerCandle[], index: number, latestClose: number): ScannerCandle[] {
  const next = candles.map(item => ({ ...item }));
  next[index] = candle(index, { open: 100, high: 110, low: 90, close: 108, volume: 4000 });
  const latest = next.length - 1;
  next[latest] = candle(latest, { open: latestClose, high: 130, low: latestClose - 1, close: latestClose, volume: 1000 });
  if (latest - 1 !== index) {
    next[latest - 1] = candle(latest - 1, { high: 120, close: 100, open: 100 });
  }
  return next;
}

export function stock(symbol: string, candles: ScannerCandle[], token = 1): ScannerStock {
  return {
    symbol,
    companyName: `${symbol} Ltd`,
    instrumentToken: token,
    niftyFlags: { nifty100: true },
    candles,
  };
}

export function rankedScannerPayload(): {
  stocks: { symbol: string; company_name: string; instrument_token: number; candles: ScannerCandle[] }[];
} {
  return {
    stocks: [
      { symbol: 'TCS', company_name: 'Tata Consultancy', instrument_token: 2953217, candles: withBreakout(history(45), 30, 100) },
      { symbol: 'INFY', company_name: 'Infosys', instrument_token: 408065, candles: withBreakout(history(45), 40, 100) },
    ],
  };
}
