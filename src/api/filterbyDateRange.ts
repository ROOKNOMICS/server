// src/api/filterByDateRange.ts
import { PriceDay } from './fetchPrice'

export function filterByDateRange(
  prices:    PriceDay[],
  startDate: string,    // "2010-01-01"
  endDate:   string     // "2023-12-31"
): PriceDay[] {

  return prices.filter(day =>
    day.date >= startDate && day.date <= endDate
  )

  // String comparison works here because dates are in YYYY-MM-DD format
  // "2010-01-04" >= "2010-01-01" evaluates correctly as a string comparison
}