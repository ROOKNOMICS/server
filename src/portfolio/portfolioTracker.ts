interface PriceDay {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Define the shape of one trade
interface Trade {
  date: string;
  action: "BUY" | "SELL";
  price: number;
}

// Define the shape of one day's portfolio snapshot
interface PortfolioDay {
  date: string;
  value: number;
}

export function buildPorfolio(
  priceData: PriceDay[],
  tradeLog: Trade[],
  initialCash: number = 10000,
) {
  let cash: number = initialCash;
  let shares: number = 0;
  const tradeMap: Record<string, Trade> = {};
  for (const trade of tradeLog) {
    tradeMap[trade.date] = trade;
  }
    const series: PortfolioDay[] = []




  for (const day of priceData){
    const trade=tradeMap[day.date]
     if (trade?.action === 'BUY' && cash > 0) {
      shares = cash / trade.price
      cash   = 0
    }

    if (trade?.action === 'SELL' && shares > 0) {
      cash   = shares * trade.price
      shares = 0
    }

    series.push({
      date:  day.date,
      value: Math.round(cash + shares * day.close)
    })
  }
}
