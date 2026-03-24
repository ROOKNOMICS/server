// src/api/fetchSP500.ts
import { fetchPrices, PriceDay } from './fetchPrice'

// SP500 is just SPY — the most popular S&P 500 index fund
// It tracks the S&P 500 almost perfectly
export async function fetchSP500(): Promise<PriceDay[]> {
  return fetchPrices('SPY')
}