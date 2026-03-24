// src/api/prepareMarketData.ts
import { fetchPrices, PriceDay     } from './fetchPrice'
import { fetchSP500                } from './fetchSP500'
import { filterByDateRange         } from './filterbyDateRange'
import { calcMovingAverage, calcRSI} from '../engine/indicator'
export interface IndicatorDay {
  date:  string
  value: number | null  // null means not enough history yet
}
export interface MarketData {
  symbol:    string
  prices:    PriceDay[]       // filtered to date range
  sp500:     PriceDay[]       // filtered to same date range
  ma50:      IndicatorDay[]   // 50-day moving average
  ma200:     IndicatorDay[]   // 200-day moving average
  rsi:       IndicatorDay[]   // 14-day RSI
}

export async function prepareMarketData(
  symbol:    string,
  startDate: string,
  endDate:   string
): Promise<MarketData> {

  // Fetch both in parallel — faster than one after the other
  const [allPrices, allSP500] = await Promise.all([
    fetchPrices(symbol),
    fetchSP500()
  ])

  // Filter both to the user's selected date range
  const prices = filterByDateRange(allPrices, startDate, endDate)
  const sp500  = filterByDateRange(allSP500,  startDate, endDate)

  // Calculate all indicators on the filtered price data
  const ma50  = calcMovingAverage(prices, 50)
  const ma200 = calcMovingAverage(prices, 200)
  const rsi   = calcRSI(prices, 14)

  return { symbol, prices, sp500, ma50, ma200, rsi }
}