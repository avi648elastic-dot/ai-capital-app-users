// metrics.ts
// Robust, window-aware portfolio metrics for 7d / 30d / 60d / 90d

export type Bar = {
  t: string | number | Date;   // timestamp or ISO
  open?: number;
  high?: number;
  low?: number;
  close: number;               // use Close OR Adj Close (be consistent)
};

export type WindowKey = "7d" | "30d" | "60d" | "90d";

export type TopPriceMode = "high" | "close"; // pick one globally in your app

export type TickerWindowMetrics = {
  symbol: string;
  window: WindowKey;
  startPrice: number;
  endPrice: number;
  returnPct: number;         // ((end/start)-1)*100
  returnDollar: number;      // end - start
  volatilityAnnual: number;  // stdev(logR) * sqrt(252)
  sharpe: number;            // ((meanDaily - rfDaily)/stdevDaily) * sqrt(252)
  maxDrawdownPct: number;    // negative number, e.g. -12.34
  topPrice: number;          // max(high) or max(close) per window
};

const TRADING_DAYS_PER_YEAR = 252;

function ts(x: string | number | Date): number {
  const v = (x instanceof Date) ? x.getTime() : (typeof x === "number" ? x : Date.parse(x));
  if (!Number.isFinite(v)) throw new Error(`Bad timestamp: ${x}`);
  return v;
}

/** Inclusive window cut by days backward from the last bar's time. */
export function cutWindow(bars: Bar[], key: WindowKey): Bar[] {
  if (!bars.length) return [];

  const sorted = [...bars].sort((a,b) => ts(a.t) - ts(b.t));
  const endTs = ts(sorted[sorted.length - 1].t);
  const daysBack = key === "7d" ? 7 : key === "30d" ? 30 : key === "60d" ? 60 : 90;
  const startTs = endTs - daysBack * 24 * 60 * 60 * 1000;

  return sorted.filter(b => ts(b.t) >= startTs && ts(b.t) <= endTs);
}

function ensureWindow(windowBars: Bar[], symbol: string, window: WindowKey) {
  if (windowBars.length < 2) throw new Error(`${symbol} ${window}: not enough bars`);
}

export const calcReturnPct = (start: number, end: number) => (end / start - 1) * 100;
export const calcReturnDollar = (start: number, end: number) => end - start;

export const logReturns = (closes: number[]) =>
  closes.slice(1).map((c, i) => Math.log(c / closes[i]));

export const mean = (xs: number[]) => xs.reduce((a,b)=>a+b,0)/xs.length;
export const stdev = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map(x => (x - m) ** 2)));
};

/** Annualized historical volatility from daily log returns. */
export function calcVolAnnualFromCloses(closes: number[]): number {
  const lr = logReturns(closes);
  if (!lr.length) return 0;
  return stdev(lr) * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100;
}

/** Sharpe with annualization; rfAnnual e.g. 0.02 for 2% */
export function calcSharpeFromCloses(closes: number[], rfAnnual = 0.02): number {
  const lr = logReturns(closes);
  if (!lr.length) return 0;
  const rfDaily = rfAnnual / TRADING_DAYS_PER_YEAR;
  const m = mean(lr);
  const sd = stdev(lr);
  if (sd === 0) return 0;
  return ((m - rfDaily) / sd) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/** Max drawdown using equity curve made from closes. Returns negative percentage. */
export function calcMddPctFromCloses(closes: number[]): number {
  let peak = closes[0];
  let mdd = 0;
  for (const p of closes) {
    peak = Math.max(peak, p);
    const dd = (p / peak - 1) * 100;
    if (dd < mdd) mdd = dd;
  }
  return mdd;
}

/** Window top price (intraday high or closing high) */
export const calcTopPrice = (bars: Bar[], mode: TopPriceMode) =>
  Math.max(...bars.map(b => (mode === "high" ? (b.high ?? b.close) : b.close)));

export function computeMetricsForWindow(
  symbol: string,
  allBars: Bar[],
  window: WindowKey,
  topMode: TopPriceMode = "high",
  rfAnnual = 0.02
): TickerWindowMetrics {
  const w = cutWindow(allBars, window);
  ensureWindow(w, symbol, window);
  const start = w[0].close;
  const end = w[w.length - 1].close;
  const closes = w.map(b => b.close);

  return {
    symbol,
    window,
    startPrice: start,
    endPrice: end,
    returnPct: round2(calcReturnPct(start, end)),
    returnDollar: round4(calcReturnDollar(start, end)),
    volatilityAnnual: round2(calcVolAnnualFromCloses(closes)),
    sharpe: round2(calcSharpeFromCloses(closes, rfAnnual)),
    maxDrawdownPct: round2(calcMddPctFromCloses(closes)),
    topPrice: round4(calcTopPrice(w, topMode)),
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

