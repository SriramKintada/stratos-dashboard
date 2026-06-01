export interface PortfolioState {
  initialized: boolean;
  start_date: string;
  corpus: number;
  cash: number;
  positions: Record<string, { shares: number; avg_price: number }>;
  total_value: number;
  daily_start_value: number;
  trades_today: number;
  last_update: string;
  version: string;
}

export interface Trade {
  date: string;
  time: string;
  symbol: string;
  action: "BUY" | "SELL";
  shares: number;
  price: number;
  value: number;
}

export interface MetricRow {
  date: string;
  portfolio_value: number;
  daily_return: number;
  cumulative_return: number;
  drawdown: number;
  vix: number;
  cash_ratio: number;
  regime: string;
  data_source: string;
}

export interface SyncInfo {
  last_sync: string;
  version: string;
}

const BASE = process.env.NEXT_PUBLIC_DATA_URL || "";

function n(v: any): number {
  return typeof v === "number" ? v : parseFloat(v) || 0;
}

function coerceMetric(m: any): MetricRow {
  return {
    date: String(m.date || ""),
    portfolio_value: n(m.portfolio_value),
    daily_return: n(m.daily_return),
    cumulative_return: n(m.cumulative_return),
    drawdown: n(m.drawdown),
    vix: n(m.vix),
    cash_ratio: n(m.cash_ratio),
    regime: String(m.regime || ""),
    data_source: String(m.data_source || ""),
  };
}

function coercePortfolio(p: any): PortfolioState {
  const positions: Record<string, { shares: number; avg_price: number }> = {};
  if (p.positions && typeof p.positions === "object") {
    for (const [sym, pos] of Object.entries(p.positions)) {
      const pp = pos as any;
      positions[sym] = { shares: n(pp.shares), avg_price: n(pp.avg_price) };
    }
  }
  return {
    initialized: !!p.initialized,
    start_date: String(p.start_date || ""),
    corpus: n(p.corpus),
    cash: n(p.cash),
    positions,
    total_value: n(p.total_value),
    daily_start_value: n(p.daily_start_value),
    trades_today: n(p.trades_today),
    last_update: String(p.last_update || ""),
    version: String(p.version || ""),
  };
}

function coerceTrade(t: any): Trade {
  return {
    date: String(t.date || ""),
    time: String(t.time || ""),
    symbol: String(t.symbol || ""),
    action: String(t.action || "BUY") as "BUY" | "SELL",
    shares: n(t.shares),
    price: n(t.price),
    value: n(t.value),
  };
}

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getPortfolio(): Promise<PortfolioState | null> {
  const raw = await fetchJSON<any>("/portfolio.json");
  return raw ? coercePortfolio(raw) : null;
}

export async function getTrades(): Promise<Trade[]> {
  const raw = await fetchJSON<any[]>("/trades.json");
  return raw ? raw.map(coerceTrade) : [];
}

export async function getMetrics(): Promise<MetricRow[]> {
  const raw = await fetchJSON<any[]>("/metrics.json");
  return raw ? raw.map(coerceMetric) : [];
}

export const getSyncInfo = () => fetchJSON<SyncInfo>("/last_sync.json");