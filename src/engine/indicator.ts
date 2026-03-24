// src/engine/indicators.ts
import { PriceDay } from '../api/fetchPrice'

// What one indicator value looks like
export interface IndicatorDay {
  date:  string
  value: number | null  // null means not enough history yet
}

export function calcMovingAverage(
  prices: PriceDay[],
  period: number        // 50 for MA50, 200 for MA200
): IndicatorDay[] {

  return prices.map((day, index) => {

    // Not enough history yet
    if (index < period - 1) {
      return { date: day.date, value: null }
    }

    // Grab the last N days including today
    const slice = prices.slice(index - period + 1, index + 1)

    // Average the closing prices
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

    // Not enough history yet
    if (index < period) {
      return { date: day.date, value: null }
    }

    // Calculate the daily price changes over the period
    const changes: number[] = []
    for (let i = index - period + 1; i <= index; i++) {
      changes.push(prices[i]!.close - prices[i - 1]!.close)
    }

    // Separate into gains and losses
    const gains  = changes.filter(c => c > 0)
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c))

    // Average gain and average loss over the period
    const avgGain = gains.length > 0
      ? gains.reduce((a, b) => a + b, 0) / period
      : 0

    const avgLoss = losses.length > 0
      ? losses.reduce((a, b) => a + b, 0) / period
      : 0

    // Avoid dividing by zero — if no losses, RSI is 100
    if (avgLoss === 0) return { date: day.date, value: 100 }

    const rs  = avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))

    return { date: day.date, value: +rsi.toFixed(2) }
  })
}