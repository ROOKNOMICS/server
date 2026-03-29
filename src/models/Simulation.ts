import mongoose, { Document, Schema } from 'mongoose';

interface Performance {
  totalReturn: number;
  benchmarkReturn: number;
  finalValue: number;
  benchmarkFinalValue: number;
  maxDrawdown: number;
  sharpeRatio: number;
  dailyVolatility: number;
  numberOfTrades: number;
  winRate: number;
  profitFactor: number;
  avgHoldingDays: number;
}

interface Trade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  shares: number;
  signal: string;
  pnl: number | null;
  pnlPct: number | null;
  totalValue: number;
  holdingDays: number | null;
}

interface Verdict {
  status: 'OUTPERFORMED' | 'UNDERPERFORMED' | 'NO_SIGNIFICANT_DIFFERENCE' | 'STRATEGY_INACTIVE';
  summary: string;
  insights: string[];
}

interface Strategy {
  symbol: string;
  startDate: string;
  endDate: string;
  capital: number;
  activeRules: string[];
  rulesConfig: Record<string, unknown>;
}

export interface ISimulation extends Document {
  userId: mongoose.Types.ObjectId;
  strategy: Strategy;
  performance: Performance;
  trades: Trade[];
  verdict: Verdict;
  createdAt: Date;
}

const SimulationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    strategy: { type: Schema.Types.Mixed, required: true },
    performance: { type: Schema.Types.Mixed, required: true },
    trades: { type: Array, required: true },
    verdict: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISimulation>('Simulation', SimulationSchema);
