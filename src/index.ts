import { prepareMarketData } from './api/prepareMarketData.js'
import { createBacktestInput } from './backtest/createBacktestInput.js'
import { generateVerdict } from './backtest/metrics.js'
import { runBacktest } from './backtest/runBacktest.js'
import type { Verdict } from './backtest/metrics.js'

export interface MainResponse {
  performance: {
    totalReturn: number
    benchmarkReturn: number
    finalValue: number
    benchmarkFinalValue: number
    maxDrawdown: number
    sharpeRatio: number
    dailyVolatility: number
    numberOfTrades: number
    winRate: number
    profitFactor: number
    avgHoldingDays: number
  }
  trades: {
    date: string
    type: 'BUY' | 'SELL'
    price: number
    shares: number
    signal: string
    pnl: number | null
    pnlPct: number | null
    totalValue: number
    holdingDays: number | null
  }[]
  verdict: Verdict
}
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

const handlerResponse= async(symbol: string, startDate:string, endDate:string, capital:number, activeRules: string[], rulesConfig: RulesConfig
): Promise<MainResponse> =>{
  const marketData = await prepareMarketData(symbol, startDate, endDate)
  const input = createBacktestInput(marketData, activeRules, capital)
  const result = runBacktest(
    input.prices,
    input.indicators,
    input.activeRuleNames,
    input.capital,
    rulesConfig
  )
  const verdict = generateVerdict({
    metrics: result.metrics,
    benchmarkReturn: result.benchmarkReturn,
    equityCurve: result.equityCurve,
    tradeLog: result.tradeLog,
    prices: input.prices,
  })
  const trades: MainResponse['trades'] = result.tradeLog.map(item => ({
    date: item.date,
    type: item.type,
    price: item.price,
    shares: item.shares,
    signal: item.signal,
    pnl: item.pnl,
    pnlPct: item.pnlPct,
    totalValue: item.totalValue,
    holdingDays: item.holdingDays,
  }))

  const response: MainResponse = {
    performance: {
      totalReturn: result.metrics.totalReturn,
      benchmarkReturn: result.benchmarkReturn,
      finalValue: result.metrics.finalValue,
      benchmarkFinalValue: result.benchmarkFinalValue,
      maxDrawdown: result.metrics.maxDrawdown,
      sharpeRatio: result.metrics.sharpeRatio,
      dailyVolatility: result.metrics.dailyVolatility,
      numberOfTrades: result.metrics.totalTrades,
      winRate: result.metrics.winRate,
      profitFactor: result.metrics.profitFactor,
      avgHoldingDays: result.metrics.avgHoldingDays,
    },
    trades,
    verdict,
  }
  return response
}
export default handlerResponse
