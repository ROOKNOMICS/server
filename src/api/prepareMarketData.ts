// src/api/prepareMarketData.ts
import { fetchPrices, PriceDay } from './fetchPrice.js'
import { fetchSP500 } from './fetchSP500.js'
import { filterByDateRange } from './filterbyDateRange.js'
import {
  BollingerBandDay,
  calcBollingerBands,
  calcMovingAverage,
  calcRSI,
  IndicatorDay,
} from '../engine/indicator.js'

export interface MarketData {
  symbol: string
  prices: PriceDay[]
  sp500: PriceDay[]
  ma20: IndicatorDay[]
  ma50: IndicatorDay[]
  ma200: IndicatorDay[]
  rsi14: IndicatorDay[]
  bb20: BollingerBandDay[]
}

export async function prepareMarketData(
  symbol: string,
  startDate: string,
  endDate: string
): Promise<MarketData> {
  const [allPrices, allSP500] = await Promise.all([
    fetchPrices(symbol,startDate,endDate),
    fetchSP500(startDate,endDate),
  ])

  const prices = filterByDateRange(allPrices, startDate, endDate)
  const sp500 = filterByDateRange(allSP500, startDate, endDate)

  const ma20 = calcMovingAverage(prices, 20)
  const ma50 = calcMovingAverage(prices, 50)
  const ma200 = calcMovingAverage(prices, 200)
  const rsi14 = calcRSI(prices, 14)
  const bb20 = calcBollingerBands(prices, 20, 2)

  return { symbol, prices, sp500, ma20, ma50, ma200, rsi14, bb20 }
}
