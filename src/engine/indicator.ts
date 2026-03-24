// src/engine/indicators.ts
import { PriceDay } from '../api/fetchPrice.js'

// What one indicator value looks like
export interface IndicatorDay {
  date: string
  value: number | null
}

export interface BollingerBandDay {
  date: string
  upper: number | null
  mid: number | null
  lower: number | null
}

export function calcMovingAverage(
  prices: PriceDay[],
  period: number
): IndicatorDay[] {
  return prices.map((day, index) => {
    if (index < period - 1) {
      return { date: day.date, value: null }
    }

    const slice = prices.slice(index - period + 1, index + 1)
    const sum = slice.reduce((total, d) => total + d.close, 0)
    const avg = sum / period

    return { date: day.date, value: +avg.toFixed(4) }
  })
}

export function calcRSI(
  prices: PriceDay[],
  period: number = 14
): IndicatorDay[] {
  return prices.map((day, index) => {
    if (index < period) {
      return { date: day.date, value: null }
    }

    const changes: number[] = []
    for (let i = index - period + 1; i <= index; i++) {
      changes.push(prices[i]!.close - prices[i - 1]!.close)
    }

    const gains = changes.filter(c => c > 0)
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c))

    const avgGain = gains.length > 0
      ? gains.reduce((a, b) => a + b, 0) / period
      : 0

    const avgLoss = losses.length > 0
      ? losses.reduce((a, b) => a + b, 0) / period
      : 0

    if (avgLoss === 0) {
      return { date: day.date, value: 100 }
    }

    const rs = avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))

    return { date: day.date, value: +rsi.toFixed(2) }
  })
}

export function calcBollingerBands(
  prices: PriceDay[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandDay[] {
  return prices.map((day, index) => {
    if (index < period - 1) {
      return { date: day.date, upper: null, mid: null, lower: null }
    }

    const slice = prices.slice(index - period + 1, index + 1)
    const closes = slice.map(price => price.close)
    const mean = closes.reduce((sum, close) => sum + close, 0) / period
    const variance = closes.reduce((sum, close) => {
      return sum + (close - mean) ** 2
    }, 0) / period
    const standardDeviation = Math.sqrt(variance)

    return {
      date: day.date,
      upper: +(mean + standardDeviation * stdDevMultiplier).toFixed(4),
      mid: +mean.toFixed(4),
      lower: +(mean - standardDeviation * stdDevMultiplier).toFixed(4),
    }
  })
}
