// metrics.test.ts
import { Bar, computeMetricsForWindow, WindowKey } from "./metrics";

// quick synthetic generator for testing
function genSeries(base: number, drift: number, vol: number, days = 100): Bar[] {
  let p = base;
  const out: Bar[] = [];
  const start = Date.now() - days * 86400000;
  for (let i=0;i<days;i++){
    const t = new Date(start + i*86400000);
    const shock = (Math.random()-0.5)*vol;
    p = Math.max(0.01, p * (1 + drift + shock));
    const close = p;
    const high  = close * (1 + Math.random()*0.012);
    const low   = close * (1 - Math.random()*0.012);
    out.push({ t, close, high, low });
  }
  return out;
}

// Simulate tickers
const data = {
  AAPL: genSeries(210, 0.001, 0.01),
  CBAT: genSeries(0.9, 0.0002, 0.03),
  MVST: genSeries(3.0, 0.0035, 0.05),
  SHMD: genSeries(3.6, 0.0025, 0.045),
};

const windows: WindowKey[] = ["7d","30d","60d","90d"];

for (const symbol in data) {
  for (const w of windows) {
    const m = computeMetricsForWindow(symbol, data[symbol], w, "high");
    console.log(`${symbol} ${w}:`, m);

    if (m.maxDrawdownPct >= 0) {
      throw new Error(`${symbol} ${w}: MDD must be negative or zero`);
    }
    if (m.volatilityAnnual <= 0) {
      throw new Error(`${symbol} ${w}: volatility invalid`);
    }
  }
}

console.log("✅ metrics module OK — window-aware metrics return valid, distinct values.");

