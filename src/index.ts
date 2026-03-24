import { prepareMarketData } from './api/prepareMarketData.js'
import { createBacktestInput } from './backtest/createBacktestInput.js'
import { generateVerdict } from './backtest/metrics.js'
import { GET } from './api/prices.js'
import { runPortfolioAnalysis } from './portfolio/index.js'
import { runBacktest } from './backtest/runBacktest.js'
import express from 'express'
const app=express()
app.get('/api/prices', GET)
app.listen(3000,()=>{
  console.log('listening @ 3000')
})
export default async function main(symbol: string, startDate:string, endDate:string, capital:number, activeRules: string[]): Promise<void> {
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
    input.capital
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
  const response={
    "verdict":{
      "type": verdict.type.toUpperCase(),
      "title": verdict.title,
      "desc": verdict.description
    },
    "bench"
  }

  console.log(`\nBacktest for ${marketData.symbol} (${startDate} to ${endDate})`)
  console.log('\nMetrics')
  console.log(result.metrics)

  console.log('\nBenchmark')
  console.log(`Strategy: ${result.metrics.totalReturn}%`)
  console.log(`Benchmark: ${result.benchmarkReturn}%`)
  console.log(`Final Value: $${result.metrics.finalValue}`)

  console.log('\nVerdict')
  console.log(`Type: ${verdict.type.toUpperCase()}`)
  console.log(`Title: ${verdict.title}`)
  console.log(`Desc: ${verdict.description}`)

  console.log('\nTrade Log')
  console.table(result.tradeLog)

  console.log('\nPortfolio Metrics')
  console.log(portfolioResult.portfolioMetrics)

  console.log('\nBenchmark Portfolio Metrics')
  console.log(portfolioResult.benchmarkMetrics)

  console.log('\nPortfolio Series Preview')
  console.table(portfolioResult.portfolioSeries.slice(-5))

  console.log('\nBenchmark Series Preview')
  console.table(portfolioResult.benchmarkSeries.slice(-5))


}
