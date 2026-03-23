import type { EquityPoint, TradeEvent, BacktestMetrics } from './types';
import { mean, stdDev, round2 } from './utils';

export function calculateMetrics(
  equityCurve: EquityPoint[],
  tradeLog: TradeEvent[],
  initialCapital: number
): BacktestMetrics {
  if (equityCurve.length === 0) {
    return {
      totalReturn: 0,
      finalValue: round2(initialCapital),
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      profitFactor: 0,
      avgHoldingDays: 0,
      totalTrades: 0,
    };
  }

  // ── Total Return ───────────────────────────────────────
  const finalPoint = equityCurve[equityCurve.length - 1]!;
  const finalValue = finalPoint.value;
  const totalReturn = round2((finalValue - initialCapital) / initialCapital * 100);

  // ── Max Drawdown ───────────────────────────────────────
  let peak = -Infinity;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const drawdown = (peak - point.value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  maxDrawdown = round2(maxDrawdown * 100);

  // ── Sharpe Ratio ───────────────────────────────────────
  const dailyReturns = equityCurve.map((point, i) => {
    if (i === 0) return 0;
    const previousPoint = equityCurve[i - 1]!;
    return (point.value - previousPoint.value) / previousPoint.value;
  });
  const avgDailyReturn = mean(dailyReturns);
  const daily_StdDev = stdDev(dailyReturns);
  const sharpeRatio = daily_StdDev === 0
    ? 0
    : round2((avgDailyReturn / daily_StdDev) * Math.sqrt(252));

  // ── Win Rate ───────────────────────────────────────────
  const completedTrades = tradeLog.filter(t => t.type === 'SELL');
  const winningTrades = completedTrades.filter(t => (t.pnl ?? 0) > 0);
  const winRate = completedTrades.length === 0
    ? 0
    : round2((winningTrades.length / completedTrades.length) * 100);

  // ── Profit Factor ──────────────────────────────────────
  const grossProfit = completedTrades
    .filter(t => (t.pnl ?? 0) > 0)
    .reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const grossLoss = completedTrades
    .filter(t => (t.pnl ?? 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnl ?? 0), 0);
  const profitFactor = grossLoss === 0
    ? grossProfit > 0 ? 999 : 0
    : round2(grossProfit / grossLoss);

  // ── Average Holding Days ───────────────────────────────
  const holdingDays = completedTrades.map(t => t.holdingDays ?? 0);
  const avgHoldingDays = round2(mean(holdingDays));

  return {
    totalReturn,
    finalValue: round2(finalValue),
    maxDrawdown,
    sharpeRatio,
    winRate,
    profitFactor,
    avgHoldingDays,
    totalTrades: completedTrades.length,
  };
}
