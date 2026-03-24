// src/api/fetchPrices.ts
import axios from 'axios'
import * as dotenv from 'dotenv'


dotenv.config()
// Define exactly what one day of price data looks like
export interface PriceDay {
  date:   string   // "2010-01-04"
  open:   number   // 626.95
  high:   number   // 629.51
  low:    number   // 624.24
  close:  number   // 626.75
  volume: number   // 1234000
}

export async function fetchPrices(symbol: string): Promise<PriceDay[]> {

  // Check localStorage first — no point hitting the API if we
  // already fetched this symbol recently
  const API_KEY= process.env.ALPHA_VANTAGE_API
  const cacheKey = `prices_${symbol}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    console.log(`Using cached data for ${symbol}`)
    return JSON.parse(cached)
  }

  console.log(`Fetching fresh data for ${symbol} from Alpha Vantage...`)

  // Build the API URL
  // outputsize=full means get 20+ years of data, not just 100 days
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${API_KEY}`

  try {
    const response = await axios.get(url)

    // Check if the API returned an error
    // Alpha Vantage returns errors inside the JSON, not as HTTP error codes
    if (response.data['Error Message']) {
      throw new Error(`Symbol not found: ${symbol}`)
    }

    if (response.data['Note']) {
      throw new Error('API rate limit reached. Please wait and try again.')
    }

    // Grab the time series object from the response
    const timeSeries = response.data['Time Series (Daily)']

    // Convert from object to array, parse strings to numbers,
    // and sort oldest first
    const prices: PriceDay[] = Object.entries(timeSeries)
      .map(([date, values]: [string, any]) => ({
        date,
        open:   parseFloat(values['1. open']),
        high:   parseFloat(values['2. high']),
        low:    parseFloat(values['3. low']),
        close:  parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Save to localStorage so we do not burn through API calls
    localStorage.setItem(cacheKey, JSON.stringify(prices))

    return prices

  } catch (error) {
    console.error('Failed to fetch prices:', error)
    throw error
  }
}
