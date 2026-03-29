import type { EquityPoint, PriceBar, TradeEvent, BacktestMetrics } from './types.js';
import { mean, stdDev, round2 } from './utils.js';

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
      dailyVolatility: 0,
      winRate: 0,
      profitFactor: 0,
      avgHoldingDays: 0,
      totalTrades: 0,
    };
  }

  const finalPoint = equityCurve[equityCurve.length - 1]!;
  const finalValue = finalPoint.value;
  const totalReturn = round2((finalValue - initialCapital) / initialCapital * 100);

  let peak = -Infinity;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const drawdown = (peak - point.value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  maxDrawdown = round2(maxDrawdown * 100);

  const dailyReturns = equityCurve.map((point, i) => {
    if (i === 0) return 0;
    const previousPoint = equityCurve[i - 1]!;
    return (point.value - previousPoint.value) / previousPoint.value;
  });
  const avgDailyReturn = mean(dailyReturns);
  const dailyStdDev = stdDev(dailyReturns);
  const dailyVolatility = round2(dailyStdDev * 100);
  const sharpeRatio = dailyStdDev === 0
    ? 0
    : round2((avgDailyReturn / dailyStdDev) * Math.sqrt(252));

  const completedTrades = tradeLog.filter(t => t.type === 'SELL');
  const winningTrades = completedTrades.filter(t => (t.pnl ?? 0) > 0);
  const winRate = completedTrades.length === 0
    ? 0
    : round2((winningTrades.length / completedTrades.length) * 100);

  const grossProfit = completedTrades
    .filter(t => (t.pnl ?? 0) > 0)
    .reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const grossLoss = completedTrades
    .filter(t => (t.pnl ?? 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnl ?? 0), 0);
  const profitFactor = grossLoss === 0
    ? grossProfit > 0 ? 999 : 0
    : round2(grossProfit / grossLoss);

  const holdingDays = completedTrades.map(t => t.holdingDays ?? 0);
  const avgHoldingDays = round2(mean(holdingDays));

  return {
    totalReturn,
    finalValue: round2(finalValue),
    maxDrawdown,
    sharpeRatio,
    dailyVolatility,
    winRate,
    profitFactor,
    avgHoldingDays,
    totalTrades: completedTrades.length,
  };
}

export type VerdictStatus =
  | 'OUTPERFORMED'
  | 'UNDERPERFORMED'
  | 'NO_SIGNIFICANT_DIFFERENCE'
  | 'STRATEGY_INACTIVE';

export interface Verdict {
  status: VerdictStatus;
  summary: string;
  insights: string[];
}

export interface VerdictInput {
  metrics: BacktestMetrics;
  benchmarkReturn: number;
  equityCurve: EquityPoint[];
  tradeLog: TradeEvent[];
  prices: PriceBar[];
}

function buildSummary(
  status: VerdictStatus,
  metrics: BacktestMetrics,
  benchmarkReturn: number
): string {
  if (status === 'STRATEGY_INACTIVE') {
    return `Strategy inactive: no trades were executed, so the strategy returned ${metrics.totalReturn}% while the benchmark returned ${benchmarkReturn}%.`;
  }

  if (status === 'NO_SIGNIFICANT_DIFFERENCE') {
    return `No significant difference: the strategy returned ${metrics.totalReturn}% versus ${benchmarkReturn}% for the benchmark.`;
  }

  const verb = status === 'OUTPERFORMED' ? 'outperformed' : 'underperformed';
  return `Your strategy ${verb} the benchmark, returning ${metrics.totalReturn}% versus ${benchmarkReturn}% for buy-and-hold.`;
}

function getTradingDaysSpan(prices: PriceBar[]): number {
  if (prices.length < 2) return prices.length;
  return prices.length - 1;
}

function analyzeMissedTrends(prices: PriceBar[], tradeLog: TradeEvent[]): number {
  const sells = tradeLog.filter(trade => trade.type === 'SELL');
  if (sells.length === 0) return 0;

  let missedTrendCount = 0;

  for (const sell of sells) {
    const sellIndex = prices.findIndex(price => price.date === sell.date);
    if (sellIndex === -1) continue;

    const lookAhead = prices.slice(sellIndex + 1, sellIndex + 11);
    const maxFutureClose = lookAhead.reduce(
      (maxClose, bar) => Math.max(maxClose, bar.close),
      sell.price
    );

    if (maxFutureClose >= sell.price * 1.05) {
      missedTrendCount += 1;
    }
  }

  return sells.length === 0 ? 0 : missedTrendCount / sells.length;
}

export function generateVerdict({
  metrics,
  benchmarkReturn,
  equityCurve,
  tradeLog,
  prices,
}: VerdictInput): Verdict {
  const insights: string[] = [];
  const returnGap = round2(metrics.totalReturn - benchmarkReturn);
  const tradeCount = metrics.totalTrades;
  const tradingDays = getTradingDaysSpan(prices);
  const tradesPerMonth = tradingDays === 0
    ? 0
    : round2((tradeCount / tradingDays) * 21);
  const missedTrendRatio = analyzeMissedTrends(prices, tradeLog);

  let status: VerdictStatus;
  if (tradeCount === 0) {
    status = 'STRATEGY_INACTIVE';
  } else if (Math.abs(returnGap) < 1) {
    status = 'NO_SIGNIFICANT_DIFFERENCE';
  } else if (returnGap > 0) {
    status = 'OUTPERFORMED';
  } else {
    status = 'UNDERPERFORMED';
  }

  if (status === 'STRATEGY_INACTIVE') {
    insights.push('No entries were triggered, so the engine never put capital at risk.');
  }

  if (tradeCount > 0 && tradesPerMonth > 4) {
    insights.push(`High trade frequency averaged ${tradesPerMonth} completed trades per month, which can erode returns through churn.`);
  }

  if (tradeCount > 0 && metrics.winRate < 40) {
    insights.push(`Win rate was ${metrics.winRate}%, so too many trades failed to offset losses.`);
  }

  if (missedTrendRatio >= 0.4) {
    insights.push('Several exits happened before the next 10 trading days fully developed, which suggests missed upside trends.');
  }

  if (metrics.maxDrawdown >= 25) {
    insights.push(`Extreme drawdown reached ${metrics.maxDrawdown}%, which is a meaningful downside-risk warning.`);
  } else if (metrics.dailyVolatility > 2 && metrics.sharpeRatio < 1) {
    insights.push(`Daily volatility ran at ${metrics.dailyVolatility}% while Sharpe stayed at ${metrics.sharpeRatio}, so risk was not rewarded efficiently.`);
  }

  if (tradeCount > 0 && returnGap > 0 && metrics.sharpeRatio >= 1 && metrics.maxDrawdown < 20) {
    insights.push('Returns beat buy-and-hold without taking excessive drawdown, which points to disciplined execution.');
  }

  if (tradeCount > 0 && returnGap < 0 && insights.length === 0) {
    insights.push('The strategy captured less upside than buy-and-hold over the same window.');
  }

  if (tradeCount > 0 && Math.abs(returnGap) < 1 && insights.length === 0) {
    insights.push('Signal timing produced results that were effectively in line with the benchmark.');
  }

  if (insights.length === 0) {
    const latestValue = equityCurve[equityCurve.length - 1]?.value ?? metrics.finalValue;
    insights.push(`Final portfolio value ended at ${latestValue}, consistent with the measured return profile.`);
  }

  return {
    status,
    summary: buildSummary(status, metrics, benchmarkReturn),
    insights,
  };
}
