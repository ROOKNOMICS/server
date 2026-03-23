// src/engine/partB/index.ts

import { buildPortfolio } from './portfolioTracker'
import { buildBenchmarkSeries  } from './benchMarkTracker'
import {
  calcTotalReturn,
  calcMaxDrawdown,
  calcSharpeRatio
} from './metricsCalculator'

// --- Input types ---

interface PriceDay {
  date:   string
  open:   number
  high:   number
  low:    number
  close:  number
  volume: number
}

interface SP500Day {
  date:  string
  close: number
}

interface Trade {
  date:   string
  action: 'BUY' | 'SELL'
  price:  number
}

interface PartBInput {
  priceData:   PriceDay[]
  sp500Data:   SP500Day[]
  tradeLog:    Trade[]
  initialCash?: number
}

// --- Output types ---

interface SeriesDay {
  date:  string
  value: number
}

interface Metrics {
  totalReturn:  number
  maxDrawdown:  number
  sharpeRatio:  number
  totalTrades:  number
}

interface PartBOutput {
  portfolioSeries:  SeriesDay[]
  benchmarkSeries:  SeriesDay[]
  tradeLog:         Trade[]
  portfolioMetrics: Metrics
  benchmarkMetrics: Metrics
}

// --- Main function ---

export function runPartB({
  priceData,
  sp500Data,
  tradeLog,
  initialCash = 10000
}: PartBInput): PartBOutput {

  const portfolioSeries = buildPortfolio(priceData, tradeLog, initialCash)
  const benchmarkSeries = buildBenchmarkSeries(sp500Data, initialCash)

  const portfolioMetrics: Metrics = {
    totalReturn:  calcTotalReturn(portfolioSeries, initialCash),
    maxDrawdown:  calcMaxDrawdown(portfolioSeries),
    sharpeRatio:  calcSharpeRatio(portfolioSeries),
    totalTrades:  tradeLog.length
  }

  const benchmarkMetrics: Metrics = {
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