import { prepareMarketData } from './api/prepareMarketData.js'
import { createBacktestInput } from './backtest/createBacktestInput.js'
import { generateVerdict } from './backtest/metrics.js'
import { GET } from './api/prices.js'
import { runPortfolioAnalysis } from './portfolio/index.js'
import { runBacktest } from './backtest/runBacktest.js'
import type { Verdict } from './backtest/metrics.js'
import type { PortfolioMetrics } from './portfolio/metricsCalculator.js'


export interface MainResponse {
  verdict: {
    type: Uppercase<Verdict['type']>
    title: string
    desc: string
  }
  benchmark: {
    strategy: number
    benchmark: number
    finalValue: number
  }
  tradeLog: {
    date: string
    type: 'BUY' | 'SELL'
    price: number
  }[]
  portfolioMatrics: PortfolioMetrics
  benchmarkMatrics: PortfolioMetrics
  combinedData: {
    date: string
    strategy: number
    benchmark: number
  }[]
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

const verdictTypeMap: Record<Verdict['type'], MainResponse['verdict']['type']> = {
  outperform: 'OUTPERFORM',
  underperform: 'UNDERPERFORM',
  neutral: 'NEUTRAL',
}

const handlerResponse= async(symbol: string, startDate:string, endDate:string, capital:number, activeRules: string[], rulesConfig: RulesConfig
): Promise<MainResponse> =>{
  // const symbol = 'AAPL'
  // const startDate = '2022-01-01'
  // const endDate = '2023-12-1'
  // const capital = 10000
  // const activeRules = ['MA Crossover', 'RSI Entry', 'Stop Loss']

  const marketData = await prepareMarketData(symbol, startDate, endDate)
  const input = createBacktestInput(marketData, activeRules, capital)
  const result = runBacktest(
    input.prices,
    input.indicators,
    input.activeRuleNames,
    input.capital,
    rulesConfig
  )
  const portfolioResult = runPortfolioAnalysis({
    priceData: marketData.prices,
    sp500Data: marketData.sp500,
    tradeLog: result.tradeLog.map(trade => ({
      date: trade.date,
      action: trade.type,
      price: trade.price,
    })),
    initialCash: capital,
  })
  const verdict = generateVerdict(result.metrics, result.benchmarkReturn)
  const tradeLogs= result.tradeLog.map(item=>({
        date: item.date,
        type: item.type,
        price: item.price
      }))
  const combinedData: MainResponse['combinedData'] = portfolioResult.portfolioSeries.map((day, i) => ({
    date: day.date,
    strategy: day.value,
    benchmark: portfolioResult.benchmarkSeries[i]?.value ?? 0,
  }))

  const response: MainResponse = {
    "verdict":{
      "type": verdictTypeMap[verdict.type],
      "title": verdict.title,
      "desc": verdict.description
    },
    "benchmark":{
      "strategy": result.metrics.totalReturn,
      "benchmark": result.benchmarkReturn,
      "finalValue": result.benchmarkFinalValue
    },
    "tradeLog": tradeLogs,
    "portfolioMatrics":portfolioResult.portfolioMetrics,
    "benchmarkMatrics":portfolioResult.benchmarkMetrics,
    "combinedData":combinedData

  }
  // console.log(response)
  return response
  // console.log(`\nBacktest for ${marketData.symbol} (${startDate} to ${endDate})`)
  // console.log('\nMetrics')
  // console.log(result.metrics)

  // console.log('\nBenchmark')
  // console.log(`Strategy: ${result.metrics.totalReturn}%`)
  // console.log(`Benchmark: ${result.benchmarkReturn}%`)
  // console.log(`Final Value: $${result.metrics.finalValue}`)

  // console.log('\nVerdict')
  // console.log(`Type: ${verdict.type.toUpperCase()}`)
  // console.log(`Title: ${verdict.title}`)
  // console.log(`Desc: ${verdict.description}`)

  // console.log('\nTrade Log')
  // console.table(result.tradeLog)

  // console.log('\nPortfolio Metrics')
  // console.log(portfolioResult.portfolioMetrics)

  // console.log('\nBenchmark Portfolio Metrics')
  // console.log(portfolioResult.benchmarkMetrics)

  // console.log('\nPortfolio Series Preview')
  // console.table(portfolioResult.portfolioSeries.slice(-5))

  // console.log('\nBenchmark Series Preview')
  // console.table(portfolioResult.benchmarkSeries.slice(-5))


}
// main().catch(error => {
//   console.error('Backtest run failed:', error)
//   process.exitCode = 1
// })
export default handlerResponse