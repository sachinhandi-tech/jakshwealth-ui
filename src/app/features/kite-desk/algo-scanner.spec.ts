import { readStocks, scanBreakouts } from './algo-scanner';
import { history, stock, withBreakout, candle, day } from './algo-scanner.fixture';

describe('breakout scanner', () => {
  it('normalizes dates and numbers and sorts oldest first', () => {
    const [parsed] = readStocks({
      stocks: [{
        symbol: 'INFY',
        company_name: 'Infosys',
        instrument_token: '408065',
        nifty_flags: { nifty50: true, nifty100: 1 },
        candles: [
          { date: '2026-10-02T00:00:00', open: '2', high: '3', low: '1', close: '2.5', volume: '20' },
          { date: '2026-10-01', open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
        ],
      }],
    });
    expect(parsed.instrumentToken).toBe(408065);
    expect(parsed.niftyFlags).toEqual({ nifty50: true, nifty100: true });
    expect(parsed.candles.map(item => item.date)).toEqual(['2026-10-01', '2026-10-02']);
    expect(parsed.candles[0]).toEqual({ date: '2026-10-01', open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 });
  });

  it('keeps the newest setup inside the midpoint and age limits', () => {
    const candles = withBreakout(history(45), 40, 100);
    const result = scanBreakouts([stock('INFY', candles, 408065)]);
    expect(result.scanned).toBe(1);
    expect(result.setups).toHaveLength(1);
    const setup = result.setups[0];
    expect(setup.bIndex).toBe(40);
    expect(setup.daysSince).toBe(4);
    expect(setup.breakoutDate).toBe(day(40));
    expect(setup.symbol).toBe('INFY');
    expect(setup.companyName).toBe('INFY Ltd');
    expect(setup.currentPrice).toBe(100);
    expect(setup.midpoint).toBe(100);
    expect(setup.distanceFromMidpoint).toBe(0);
    expect(setup.volMultiple).toBe(4);
    expect(setup.prevHigh).toBe(101);
    expect(setup.maxPriceAfter).toBe(130);
    expect(setup.breakoutLow).toBe(90);
    expect(setup.breakoutHigh).toBe(110);
    expect(setup.candles).toHaveLength(45);
  });

  it('stops at the most recent accepted setup', () => {
    const candles = withBreakout(history(45), 40, 100);
    candles[32] = candle(32, { open: 100, high: 105, low: 95, close: 104, volume: 3000 });
    const setup = scanBreakouts([stock('INFY', candles)]).setups[0];
    expect(setup.bIndex).toBe(40);
    expect(setup.daysSince).toBe(4);
  });

  it('counts a short history as scanned and does not emit a setup', () => {
    const result = scanBreakouts([stock('SHORT', history(24))]);
    expect(result.scanned).toBe(1);
    expect(result.setups).toEqual([]);
  });

  it('rejects a breakout whose close is not above the previous high or whose volume is short', () => {
    const quiet = withBreakout(history(45), 40, 100);
    quiet[40] = candle(40, { open: 100, high: 110, low: 90, close: 100, volume: 4000 });
    const thin = withBreakout(history(45), 40, 100);
    thin[40] = candle(40, { open: 100, high: 110, low: 90, close: 108, volume: 2999 });
    expect(scanBreakouts([stock('QUIET', quiet)]).setups).toEqual([]);
    expect(scanBreakouts([stock('THIN', thin)]).setups).toEqual([]);
  });

  it('rejects a setup that never trades above the breakout high or sits outside 1%', () => {
    const flat = withBreakout(history(45), 40, 100);
    flat[44] = candle(44, { high: 110, close: 100 });
    flat[43] = candle(43, { high: 109, close: 100 });
    const far = withBreakout(history(45), 40, 102);
    expect(scanBreakouts([stock('FLAT', flat)]).setups).toEqual([]);
    expect(scanBreakouts([stock('FAR', far)]).setups).toEqual([]);
  });

  it('sorts by age and then by absolute distance from the midpoint', () => {
    const older = stock('OLDER', withBreakout(history(45), 30, 100));
    const wider = stock('WIDER', withBreakout(history(45), 40, 100.8));
    const tighter = stock('TIGHTER', withBreakout(history(45), 40, 99.5));
    const symbols = scanBreakouts([older, wider, tighter]).setups.map(item => item.symbol);
    expect(symbols).toEqual(['TIGHTER', 'WIDER', 'OLDER']);
    const ages = scanBreakouts([older, wider, tighter]).setups.map(item => item.daysSince);
    expect(ages).toEqual([4, 4, 14]);
  });

  it('keeps a result at the 1% boundary', () => {
    const setups = scanBreakouts([stock('EDGE', withBreakout(history(45), 40, 101))]).setups;
    expect(setups).toHaveLength(1);
    expect(setups[0].distanceFromMidpoint).toBeCloseTo(1, 5);
  });
});

