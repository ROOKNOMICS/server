import type { RulesMap } from './types';

export const RULES: RulesMap = {

  // ── MA Crossover ──────────────────────────────────────
  "MA Crossover": {
    buySignal: (i, prices, indicators) => {
      const { ma20, ma50 } = indicators;
      if (!ma20[i] || !ma50[i] || !ma20[i-1] || !ma50[i-1]) return false;
      return ma20[i]! > ma50[i]! && ma20[i-1]! <= ma50[i-1]!;
    },
    sellSignal: (i, prices, indicators) => {
      const { ma20, ma50 } = indicators;
      if (!ma20[i] || !ma50[i] || !ma20[i-1] || !ma50[i-1]) return false;
      return ma20[i]! < ma50[i]! && ma20[i-1]! >= ma50[i-1]!;
    }
  },

  // ── RSI Entry/Exit ────────────────────────────────────
  "RSI Entry": {
    buySignal: (i, prices, indicators) => {
      const rsi = indicators.rsi14;
      if (rsi[i] === null || rsi[i-1] === null) return false;
      return rsi[i]! >= 30 && rsi[i-1]! < 30;
    },
    sellSignal: (i, prices, indicators) => {
      const rsi = indicators.rsi14;
      if (rsi[i] === null || rsi[i-1] === null) return false;
      return rsi[i]! <= 70 && rsi[i-1]! > 70;
    }
  },

  // ── Stop Loss ─────────────────────────────────────────
  "Stop Loss": {
    buySignal: () => false,
    sellSignal: (i, prices, indicators, state) => {
      const priceBar = prices[i];
      if (state.shares === 0) return false;
      if (!priceBar) return false;
      return priceBar.close < state.entryPrice * 0.95;
    }
  },

  // ── Trailing Stop ─────────────────────────────────────
  "Trailing Stop": {
    buySignal: () => false,
    sellSignal: (i, prices, indicators, state) => {
      const priceBar = prices[i];
      if (state.shares === 0) return false;
      if (!priceBar) return false;
      return priceBar.close < state.trailingHigh * 0.97;
    }
  },

  // ── Bollinger Band Bounce ─────────────────────────────
  "Bollinger Bands": {
    buySignal: (i, prices, indicators) => {
      const bb = indicators.bb[i];
      const priceBar = prices[i];
      if (!bb) return false;
      if (!priceBar) return false;
      return priceBar.close <= bb.lower;
    },
    sellSignal: (i, prices, indicators) => {
      const bb = indicators.bb[i];
      const priceBar = prices[i];
      if (!bb) return false;
      if (!priceBar) return false;
      return priceBar.close >= bb.upper;
    }
  }

};
