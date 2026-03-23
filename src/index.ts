import { runBacktest } from './backtest/runBacktest';
import type { PriceBar, Indicators } from './backtest/types';

// Generate 200 fake daily prices
const prices: PriceBar[] = Array.from({ length: 200 }, (_, i) => {
  const close = 150 + Math.sin(i * 0.3) * 20 + i * 0.3;
  const date = new Date(2022, 0, i + 1).toISOString().split('T')[0] ?? '';
  return {
    date,
    open: close - 1,
    high: close + 2,
    low: close - 2,
    close,
    volume: 1_000_000,
  };
});

// Fake indicators (T1 will give you real ones)
const indicators: Indicators = {
  ma20: prices.map((_, i) =>
    i < 19 ? null : prices.slice(i - 19, i + 1).reduce((a, p) => a + p.close, 0) / 20
  ),
  ma50: prices.map((_, i) =>
    i < 49 ? null : prices.slice(i - 49, i + 1).reduce((a, p) => a + p.close, 0) / 50
  ),
  rsi14: prices.map(() => Math.random() * 100),
  bb: prices.map(p => ({
    upper: p.close * 1.02,
    mid: p.close,
    lower: p.close * 0.98,
  })),
};

const result = runBacktest(
  prices,
  indicators,
  ['MA Crossover', 'RSI Entry', 'Stop Loss'],
  10000
);

console.log('\n── Metrics ──────────────────────');
console.log(result.metrics);

console.log('\n── Trade Log ────────────────────');
console.table(result.tradeLog);

console.log('\n── Equity Curve (last 5) ────────');
console.log(result.equityCurve.slice(-5));
