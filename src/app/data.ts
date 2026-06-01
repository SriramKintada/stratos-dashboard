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

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const getPortfolio = () => fetchJSON<PortfolioState>("/portfolio.json");
export const getTrades = () => fetchJSON<Trade[]>("/trades.json");
export const getMetrics = () => fetchJSON<MetricRow[]>("/metrics.json");
export const getSyncInfo = () => fetchJSON<SyncInfo>("/last_sync.json");