// src/api/fetchPrices.ts
import axios from 'axios'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../.env')

dotenv.config({ path: envPath })

const priceCache = new Map<string, PriceDay[]>()

// Define exactly what one day of price data looks like
export interface PriceDay {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function fetchPrices(symbol: string, startDate:string, endDate:string): Promise<PriceDay[]> {
  const API_KEY = process.env.ALPHA_VANTAGE_API
  const normalizedSymbol = symbol.toUpperCase()
  const cacheKey = `${normalizedSymbol}:${startDate}:${endDate}`
  const cached = priceCache.get(cacheKey)

  if (cached) {
    console.log(`Using cached data for ${cacheKey}`)
    return cached
  }

  console.log(`Fetching fresh data for ${cacheKey} from local prices API...`)

  const url = `http://localhost:3000/api/prices?symbol=${normalizedSymbol}&start=${startDate}&end=${endDate}`
  try {
    const response = await axios.get<PriceDay[] | { error?: string }>(url)

    if (!Array.isArray(response.data)) {
      throw new Error(response.data.error ?? `Price fetch failed for ${cacheKey}`)
    }

    const prices = response.data

    priceCache.set(cacheKey, prices)
    return prices
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    throw error
  }
}
