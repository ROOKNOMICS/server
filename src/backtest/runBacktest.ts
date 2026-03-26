import { RULES } from './rules.js';
import { calculateMetrics } from './metrics.js';
import { daysBetween, round2 } from './utils.js';
import type {
  Indicators,
  PortfolioState,
  EquityPoint,
  TradeEvent,
  BacktestResult,
  PriceBar,
  Rule
} from './types.js';

export interface RulesConfig {
  rsi?: {
    enabled:   boolean
    period:    number
    buyBelow:  number
    sellAbove: number
  }
  maCross?: {
    enabled:    boolean
    type:       'SMA' | 'EMA'
    fastPeriod: number
    slowPeriod: number
  }
}

export function runBacktest(
  prices:          PriceBar[],
  indicators:      Indicators,
  activeRuleNames: string[],
  capital:         number = 10000,
  rulesConfig:     RulesConfig
): BacktestResult {

  
  if (rulesConfig.rsi?.enabled && RULES['RSI Entry']) {
    const rsiRule = RULES['RSI Entry'] as any
    rsiRule._buyBelow  = rulesConfig.rsi.buyBelow  
    rsiRule._sellAbove = rulesConfig.rsi.sellAbove  
    rsiRule._period    = rulesConfig.rsi.period    
  }

  if (rulesConfig.maCross?.enabled && RULES['MA Crossover']) {
    const maRule = RULES['MA Crossover'] as any
    maRule._fastPeriod = rulesConfig.maCross.fastPeriod  
    maRule._slowPeriod = rulesConfig.maCross.slowPeriod  
    maRule._type       = rulesConfig.maCross.type       
  }

  
  const filteredRuleNames = activeRuleNames.filter(name => {
    if (name === 'RSI Entry')    return rulesConfig.rsi?.enabled    ?? true
    if (name === 'MA Crossover') return rulesConfig.maCross?.enabled ?? true
    return true 
  })

  if (prices.length === 0) {
    return {
      equityCurve: [],
      tradeLog: [],
      metrics: calculateMetrics([], [], capital),
      activeRules: filteredRuleNames,
      benchmarkReturn: 0,
      benchmarkFinalValue: round2(capital),
    };
  }

  const firstBar = prices[0];
  const lastBar  = prices[prices.length - 1];

  if (!firstBar || !lastBar) {
    return {
      equityCurve: [],
      tradeLog: [],
      metrics: calculateMetrics([], [], capital),
      activeRules: filteredRuleNames,
      benchmarkReturn: 0,
      benchmarkFinalValue: round2(capital),
    };
  }

  
  const state: PortfolioState = {
    cash:         capital,
    shares:       0,
    entryPrice:   0,
    entryDate:    null,
    trailingHigh: 0,
  };

  const equityCurve: EquityPoint[] = [];
  const tradeLog:    TradeEvent[]  = [];


  for (let i = 1; i < prices.length; i++) {
    const today = prices[i];
    if (!today) continue;

    const todayDate = today.date ?? '';
    const price     = today.close;

    if (state.shares > 0) {
      state.trailingHigh = Math.max(state.trailingHigh, price);
    }

    const shouldSell = state.shares > 0 && filteredRuleNames.some(
      name => RULES[name]?.sellSignal(i, prices, indicators, state) ?? false
    );

    const shouldBuy = !shouldSell && state.shares === 0 && filteredRuleNames.some(
      name => RULES[name]?.buySignal(i, prices, indicators, state) ?? false
    );

    if (shouldBuy) {
      const sharesToBuy = Math.floor(state.cash / price);

      if (sharesToBuy > 0) {
        state.shares      = sharesToBuy;
        state.cash       -= sharesToBuy * price;
        state.entryPrice  = price;
        state.entryDate   = today.date;
        state.trailingHigh = price;

        const triggerRule = filteredRuleNames.find(
          name => RULES[name]?.buySignal(i, prices, indicators, state)
        ) ?? 'Unknown';

        tradeLog.push({
          date:       today.date,
          type:       'BUY',
          price:      round2(price),
          shares:     state.shares,
          totalValue: round2(state.shares * price),
          signal:     triggerRule,
          pnl:        null,
          pnlPct:     null,
          holdingDays: null,
        });
      }
    }

    else if (shouldSell) {
      const proceeds = state.shares * price;
      const pnl      = proceeds - state.shares * state.entryPrice;
      const pnlPct   = (pnl / (state.shares * state.entryPrice)) * 100;
      const holding  = state.entryDate && today.date
        ? daysBetween(state.entryDate, today.date)
        : 0;

      const triggerRule = filteredRuleNames.find(
        name => RULES[name]?.sellSignal(i, prices, indicators, state)
      ) ?? 'Unknown';

      tradeLog.push({
        date:        todayDate,
        type:        'SELL',
        price:       round2(price),
        shares:      state.shares,
        totalValue:  round2(proceeds),
        signal:      triggerRule,
        pnl:         round2(pnl),
        pnlPct:      round2(pnlPct),
        holdingDays: holding,
      });

      state.cash        += proceeds;
      state.shares       = 0;
      state.entryPrice   = 0;
      state.entryDate    = null;
      state.trailingHigh = 0;
    }

    const portfolioValue = state.cash + state.shares * price;
    equityCurve.push({
      date:  todayDate,
      value: round2(portfolioValue),
    });
  }

  const metrics = calculateMetrics(equityCurve, tradeLog, capital);

  const buyHoldShares     = Math.floor(capital / firstBar.close);
  const buyHoldFinalValue = buyHoldShares * lastBar.close
    + (capital - buyHoldShares * firstBar.close);
  const benchmarkReturn   = round2(
    (buyHoldFinalValue - capital) / capital * 100
  );

  return {
    equityCurve,
    tradeLog,
    metrics,
    activeRules:         filteredRuleNames,
    benchmarkReturn,
    benchmarkFinalValue: round2(buyHoldFinalValue),
  };
}