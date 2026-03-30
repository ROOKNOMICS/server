import type { Request, Response } from 'express'
import handlerResponse, { RulesConfig } from '../index.js'

interface BacktestRequestBody {
  symbol?: string
  startDate?: string
  endDate?: string
  capital?: number
  activeRules?: string[]
  rulesConfig?: RulesConfig
}

const backtestController = async (
  req: Request<unknown, unknown, BacktestRequestBody>,
  res: Response
) => {
  const { symbol, startDate, endDate, capital, activeRules, rulesConfig } = req.body

  if (
    typeof symbol !== 'string' ||
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    typeof capital !== 'number' ||
    !Array.isArray(activeRules) ||
    !activeRules.every(rule => typeof rule === 'string')
  ) {
    return res.status(400).json({
      error:
        'Invalid request body. Expected symbol, startDate, endDate, capital, activeRules, and rulesConfig.',
    })
  }

  try {
    const response = await handlerResponse(
      symbol,
      startDate,
      endDate,
      capital,
      activeRules,
      rulesConfig ?? {}
    )

    return res.status(200).json(response)
  } catch (error) {
    console.error('Backtest request failed:', error)
    return res.status(500).json({ error: 'Failed to process backtest request' })
  }
}

export default backtestController
