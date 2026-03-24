export interface SeriesDay {
  date:  string
  value: number
}

export interface PortfolioMetrics {
  totalReturn:  number
  maxDrawdown:  number
  sharpeRatio:  number
  totalTrades:  number
}

export function calcTotalReturn(
  series:      SeriesDay[],
  initialCash: number = 10000
): number {
  const finalValue = series[series.length - 1]!.value
  return +((finalValue - initialCash) / initialCash * 100).toFixed(2)
}


export function calcMaxDrawdown(series: SeriesDay[]): number {
  let peak:    number = -Infinity
  let maxDrop: number = 0

  for (const { value } of series) {
    if (value > peak) peak = value

    const drop = (value - peak) / peak * 100
    if (drop < maxDrop) maxDrop = drop
  }

  return +maxDrop.toFixed(2)
}


export function calcSharpeRatio(
  series:       SeriesDay[],
  riskFreeRate: number = 0.04
): number {

  // Calculate daily returns
  const dailyReturns: number[] = []
  for (let i = 1; i < series.length; i++) {
    const ret = (series[i]!.value - series[i - 1]!.value) / series[i - 1]!.value
    dailyReturns.push(ret)
  }

  const meanReturn: number =
    dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length

  const variance: number =
    dailyReturns
      .map(r => (r - meanReturn) ** 2)
      .reduce((a, b) => a + b, 0) / dailyReturns.length

  const stdDev: number = Math.sqrt(variance)

  const annualisedReturn: number = meanReturn * 252
  const annualisedStd:    number = stdDev * Math.sqrt(252)
  const dailyRiskFree:    number = riskFreeRate / 252

  return +((annualisedReturn - dailyRiskFree) / annualisedStd).toFixed(2)
}
