interface Strategies {
  rsi: {
    enabled:   boolean
    period:    number
    buyBelow:  number
    sellAbove: number
  }
  maCross: {
    enabled:    boolean
    type:       'SMA' | 'EMA'
    fastPeriod: number
    slowPeriod: number
  }
}

export function evaluateRules(
  index:      number,           // today's position in the price array
  rsiValues:  (number | null)[],
  ma50Values: (number | null)[],
  ma200Values:(number | null)[],
  strategies: Strategies,
  holding:    boolean           // are we currently holding shares?
): 'BUY' | 'SELL' | 'HOLD' {

  let buySignal  = false
  let sellSignal = false

  // --- RSI check ---
  if (strategies.rsi.enabled) {
    const todayRSI = rsiValues[index]

    if (todayRSI !== null) {
      if (todayRSI! < strategies.rsi.buyBelow  && !holding) buySignal  = true
      if (todayRSI! > strategies.rsi.sellAbove &&  holding) sellSignal = true
    }
  }

  // --- MA Cross check ---
  if (strategies.maCross.enabled && index > 0) {
    const todayFast     = ma50Values[index]
    const todaySlow     = ma200Values[index]
    const yesterdayFast = ma50Values[index - 1]
    const yesterdaySlow = ma200Values[index - 1]

    // All four values must be non-null to detect a crossover
    if (
      todayFast !== null && todaySlow     !== null &&
      yesterdayFast !== null && yesterdaySlow !== null
    ) {
      const goldenCross = yesterdayFast! < yesterdaySlow! && todayFast! > todaySlow!
      const deathCross  = yesterdayFast! > yesterdaySlow! && todayFast! < todaySlow!

      if (goldenCross && !holding) buySignal  = true
      if (deathCross  &&  holding) sellSignal = true
    }
  }

  // --- Final decision ---
  // Sell takes priority — if any strategy says sell, sell first
  if (sellSignal) return 'SELL'
  if (buySignal)  return 'BUY'
  return 'HOLD'
}