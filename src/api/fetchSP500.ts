// src/api/fetchSP500.ts
import { fetchPrices, PriceDay } from './fetchPrice.js'

export async function fetchSP500(
  startDate: string,
  endDate:   string
): Promise<PriceDay[]> {
  return fetchPrices('SPY', startDate, endDate)
}