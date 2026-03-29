import mongoose, { Document, Schema } from 'mongoose';

export interface IBacktest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  activeRules: string[];
  rulesConfig: {
    rsi?: {
      enabled: boolean;
      period: number;
      buyBelow: number;
      sellAbove: number;
    };
    maCross?: {
      enabled: boolean;
      type: 'SMA' | 'EMA';
      fastPeriod: number;
      slowPeriod: number;
    };
  };
  results: {
    verdict: {
      type: 'OUTPERFORM' | 'UNDERPERFORM' | 'NEUTRAL';
      title: string;
      desc: string;
    };
    benchmark: {
      strategy: number;
      benchmark: number;
      finalValue: number;
    };
    tradeLog: {
      date: string;
      type: 'BUY' | 'SELL';
      price: number;
    }[];
    portfolioMetrics: {
      totalReturn: number;
      maxDrawdown: number;
      sharpeRatio: number;
      totalTrades: number;
    };
    benchmarkMetrics: {
      totalReturn: number;
      maxDrawdown: number;
      sharpeRatio: number;
      totalTrades: number;
    };
    combinedData: {
      date: string;
      strategy: number;
      benchmark: number;
    }[];
  };
  createdAt: Date;
}

const BacktestSchema = new Schema<IBacktest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    initialCapital: {
      type: Number,
      required: true,
      min: 0,
    },
    activeRules: {
      type: [String],
      required: true,
    },
    rulesConfig: {
      rsi: {
        enabled: { type: Boolean, default: false },
        period: { type: Number, min: 1, max: 100 },
        buyBelow: { type: Number, min: 0, max: 100 },
        sellAbove: { type: Number, min: 0, max: 100 },
      },
      maCross: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ['SMA', 'EMA'] },
        fastPeriod: { type: Number, min: 1, max: 200 },
        slowPeriod: { type: Number, min: 1, max: 200 },
      },
    },
    results: {
      verdict: {
        type: {
          type: String,
          enum: ['OUTPERFORM', 'UNDERPERFORM', 'NEUTRAL'],
          required: true,
        },
        title: { type: String, required: true },
        desc: { type: String, required: true },
      },
      benchmark: {
        strategy: { type: Number, required: true },
        benchmark: { type: Number, required: true },
        finalValue: { type: Number, required: true },
      },
      tradeLog: [{
        date: { type: String, required: true },
        type: { type: String, enum: ['BUY', 'SELL'], required: true },
        price: { type: Number, required: true },
      }],
      portfolioMetrics: {
        totalReturn: { type: Number, required: true },
        maxDrawdown: { type: Number, required: true },
        sharpeRatio: { type: Number, required: true },
        totalTrades: { type: Number, required: true },
      },
      benchmarkMetrics: {
        totalReturn: { type: Number, required: true },
        maxDrawdown: { type: Number, required: true },
        sharpeRatio: { type: Number, required: true },
        totalTrades: { type: Number, required: true },
      },
      combinedData: [{
        date: { type: String, required: true },
        strategy: { type: Number, required: true },
        benchmark: { type: Number, required: true },
      }],
    },
  },
  { timestamps: true }
);

// Index for faster queries
BacktestSchema.index({ userId: 1, createdAt: -1 });
BacktestSchema.index({ symbol: 1 });
BacktestSchema.index({ 'results.verdict.type': 1 });

export default mongoose.model<IBacktest>('Backtest', BacktestSchema);
