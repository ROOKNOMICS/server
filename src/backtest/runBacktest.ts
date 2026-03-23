import { RULES } from './rules';
import { calculateMetrics } from './metrics';
import { daysBetween, round2 } from './utils';
import type {
  Indicators,
  PortfolioState,
  EquityPoint,
  TradeEvent,
  BacktestResult,
  PriceBar
} from './types';

export function runBacktest(
  prices: PriceBar[],
  indicators: Indicators,
  activeRuleNames: string[],
  capital: number = 10000
): BacktestResult {

  // ── Initial portfolio state ───────────────────────────
  const state: PortfolioState = {
    cash: capital,
    shares: 0,
    entryPrice: 0,
    entryDate: null,
    trailingHigh: 0,
  };

  const equityCurve: EquityPoint[] = [];
  const tradeLog: TradeEvent[] = [];

  // ── Day by day simulation loop ────────────────────────
  for (let i = 1; i < prices.length; i++) {
    const today = prices[i];
    if (!today) continue;
    const price = today.close;

    // Keep trailing high updated while in position
    if (state.shares > 0) {
      state.trailingHigh = Math.max(state.trailingHigh, price);
    }

    // Check buy signals across all active rules
    const shouldBuy = state.shares === 0 && activeRuleNames.some(
      name => RULES[name]?.buySignal(i, prices, indicators, state) ?? false
    );

    // Check sell signals across all active rules
    const shouldSell = state.shares > 0 && activeRuleNames.some(
      name => RULES[name]?.sellSignal(i, prices, indicators, state) ?? false
    );

    // ── Execute BUY ────────────────────────────────────
    if (shouldBuy) {
      const sharesToBuy = Math.floor(state.cash / price);
      if (sharesToBuy > 0) {
        state.shares = sharesToBuy;
        state.cash -= sharesToBuy * price;
        state.entryPrice = price;
        state.entryDate = today.date;
        state.trailingHigh = price;

        const triggerRule = activeRuleNames.find(
          name => RULES[name]?.buySignal(i, prices, indicators, state)
        ) ?? 'Unknown';

        tradeLog.push({
          date: today.date,
          type: 'BUY',
          price: round2(price),
          shares: state.shares,
          totalValue: round2(state.shares * price),
          signal: triggerRule,
          pnl: null,
          pnlPct: null,
          holdingDays: null,
        });
      }
    }

    // ── Execute SELL ───────────────────────────────────
    else if (shouldSell) {
      const proceeds = state.shares * price;
      const pnl = proceeds - state.shares * state.entryPrice;
      const pnlPct = (pnl / (state.shares * state.entryPrice)) * 100;
      const holding = state.entryDate
        ? daysBetween(state.entryDate, today.date)
        : 0;

      const triggerRule = activeRuleNames.find(
        name => RULES[name]?.sellSignal(i, prices, indicators, state)
      ) ?? 'Unknown';

      tradeLog.push({
        date: today.date,
        type: 'SELL',
        price: round2(price),
        shares: state.shares,
        totalValue: round2(proceeds),
        signal: triggerRule,
        pnl: round2(pnl),
        pnlPct: round2(pnlPct),
        holdingDays: holding,
      });

      state.cash += proceeds;
      state.shares = 0;
      state.entryPrice = 0;
      state.entryDate = null;
      state.trailingHigh = 0;
    }

    // ── Record today's portfolio value ─────────────────
    const portfolioValue = state.cash + state.shares * price;
    equityCurve.push({
      date: today.date,
      value: round2(portfolioValue),
    });
  }

  // ── Compute all metrics after loop ────────────────────
  const metrics = calculateMetrics(equityCurve, tradeLog, capital);

  return {
    equityCurve,
    tradeLog,
    metrics,
    activeRules: activeRuleNames,
  };
}
