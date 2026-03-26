
export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}


export interface BollingerBand {
  upper: number;
  mid: number;
  lower: number;
}

// ── All indicators from frontend ───
export interface Indicators {
  ma20: (number | null)[];
  ma50: (number | null)[];
  rsi14: (number | null)[];
  bb: (BollingerBand | null)[];
}


export interface PortfolioState {
  cash: number;
  shares: number;
  entryPrice: number;
  entryDate: string | null;
  trailingHigh: number;
}


export interface EquityPoint {
  date: string;
  value: number;
}


export interface TradeEvent {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  shares: number;
  totalValue: number;
  signal: string;
  pnl: number | null;
  pnlPct: number | null;
  holdingDays: number | null;
}


export interface BacktestMetrics {
  totalReturn: number;
  finalValue: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  avgHoldingDays: number;
  totalTrades: number;
}


export interface BacktestResult {
  equityCurve: EquityPoint[];
  tradeLog: TradeEvent[];
  metrics: BacktestMetrics;
  activeRules: string[];
  benchmarkReturn: number;      
  benchmarkFinalValue: number;  
}


export interface Rule {
  buySignal: (
    i: number,
    prices: PriceBar[],
    indicators: Indicators,
    state: PortfolioState
  ) => boolean;
  sellSignal: (
    i: number,
    prices: PriceBar[],
    indicators: Indicators,
    state: PortfolioState
  ) => boolean;
}

export type RulesMap = Record<string, Rule>;