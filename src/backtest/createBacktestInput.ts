import { MarketData } from '../api/prepareMarketData.js'
import type { Indicators, PriceBar } from './types.js'

export interface BacktestInput {
  prices: PriceBar[]
  indicators: Indicators
  activeRuleNames: string[]
  capital: number
}

export function createBacktestInput(
  marketData: MarketData,
  activeRuleNames: string[],
  capital: number
): BacktestInput {
  return {
    prices: marketData.prices.map(price => ({
      date: price.date,
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume,
    })),
    indicators: {
      ma20: marketData.ma20.map(point => point.value),
      ma50: marketData.ma50.map(point => point.value),
      rsi14: marketData.rsi14.map(point => point.value),
      bb: marketData.bb20.map(point => (
        point.upper === null || point.mid === null || point.lower === null
          ? null
          : {
              upper: point.upper,
              mid: point.mid,
              lower: point.lower,
            }
      )),
    },
    activeRuleNames,
    capital,
  }
}
