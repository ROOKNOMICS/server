// src/engine/benchmarkTracker.ts

interface SP500Day {
  date:  string
  close: number
}

interface BenchmarkDay {
  date:  string
  value: number
}

export function buildBenchmarkSeries(
  sp500Data:   SP500Day[],
  initialCash: number = 10000
): BenchmarkDay[] {

  // Buy on day one, never sell
  const sharesBought: number = initialCash / sp500Data[0]!.close

  return sp500Data.map((day): BenchmarkDay => ({
    date:  day.date,
    value: Math.round(sharesBought * day.close)
  }))
}