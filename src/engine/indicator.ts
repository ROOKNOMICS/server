// src/engine/indicators.ts
import { PriceDay } from '../api/fetchPrice'

// What one indicator value looks like
export interface IndicatorDay {
  date:  string
  value: number | null  // null means not enough history yet
}