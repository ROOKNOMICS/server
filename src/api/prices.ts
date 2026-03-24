import type { Request, Response } from 'express'

export async function GET(req: Request, res: Response) {
  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : undefined
  const startDate = typeof req.query.start === 'string' ? req.query.start : undefined
  const endDate = typeof req.query.end === 'string' ? req.query.end : undefined

  if (!symbol || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: 'Missing required query params: symbol, start, end' })
  }

  const from = Math.floor(new Date(startDate).getTime() / 1000)
  const to = Math.floor(new Date(endDate).getTime() / 1000)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${from}&period2=${to}`

  const response = await fetch(url)
  const data = await response.json()
  const result = data?.chart?.result?.[0]

  if (!response.ok || !result) {
    return res.status(502).json({ error: 'Failed to fetch price data' })
  }

  const timestamps = result.timestamp
  const quote = result.indicators?.quote?.[0]

  if (!timestamps || !quote) {
    return res.status(502).json({ error: 'Malformed price data response' })
  }

  const prices = timestamps.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    open: Number(quote.open[i]?.toFixed(2) ?? 0),
    high: Number(quote.high[i]?.toFixed(2) ?? 0),
    low: Number(quote.low[i]?.toFixed(2) ?? 0),
    close: Number(quote.close[i]?.toFixed(2) ?? 0),
    volume: quote.volume[i] ?? 0,
  }))

  return res.json(prices)
}
