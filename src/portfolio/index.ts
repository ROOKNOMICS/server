import { buildPortfolio } from './portfolioTracker.js'
import { buildBenchmarkSeries  } from './benchMarkTracker.js'
import {
  calcTotalReturn,
  calcMaxDrawdown,
  calcSharpeRatio
} from './metricsCalculator.js'
import type { PortfolioDay, PriceDay, Trade } from './portfolioTracker.js'
import type { BenchmarkDay, SP500Day } from './benchMarkTracker.js'
import type { PortfolioMetrics } from './metricsCalculator.js'

export interface PortfolioAnalysisInput {
  priceData:   PriceDay[]
  sp500Data:   SP500Day[]
  tradeLog:    Trade[]
  initialCash?: number
}

export interface PortfolioAnalysisOutput {
  portfolioSeries:  PortfolioDay[]
  benchmarkSeries:  BenchmarkDay[]
  tradeLog:         Trade[]
  portfolioMetrics: PortfolioMetrics
  benchmarkMetrics: PortfolioMetrics
}

export function runPortfolioAnalysis({
  priceData,
  sp500Data,
  tradeLog,
  initialCash = 10000
}: PortfolioAnalysisInput): PortfolioAnalysisOutput {

  const portfolioSeries = buildPortfolio(priceData, tradeLog, initialCash)
  const benchmarkSeries = buildBenchmarkSeries(sp500Data, initialCash)

  const portfolioMetrics: PortfolioMetrics = {
    totalReturn:  calcTotalReturn(portfolioSeries, initialCash),
    maxDrawdown:  calcMaxDrawdown(portfolioSeries),
    sharpeRatio:  calcSharpeRatio(portfolioSeries),
    totalTrades:  tradeLog.length
  }

  const benchmarkMetrics: PortfolioMetrics = {
    totalReturn:  calcTotalReturn(benchmarkSeries, initialCash),
    maxDrawdown:  calcMaxDrawdown(benchmarkSeries),
    sharpeRatio:  calcSharpeRatio(benchmarkSeries),
    totalTrades:  1
  }

  return {
    portfolioSeries,
    benchmarkSeries,
    tradeLog,
    portfolioMetrics,
    benchmarkMetrics
  }
}
