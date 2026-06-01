// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { Activity, TrendingUp, Shield, Clock, Database, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react";
import { getPortfolio, getTrades, getMetrics, getSyncInfo, type PortfolioState, type Trade, type MetricRow, type SyncInfo } from "./data";
import { fmt, pct, regimeColor, regimeBg, pnlColor, pnlSign, stockName } from "./utils";

function MetricCard({ label, value, sub, color = "text-white" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[#111118] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function VixBadge({ vix, regime }: { vix: number; regime: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${regimeBg(regime)}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${regime === "CALM" ? "bg-emerald-400 pulse-dot" : regime === "ELEVATED" ? "bg-amber-400 pulse-dot" : regime === "STRESSED" ? "bg-orange-400 pulse-dot" : "bg-red-400 pulse-dot"}`} />
      <span className="text-sm tabular-nums">VIX {vix.toFixed(1)}</span>
      <span className={`text-xs font-medium ${regimeColor(regime)}`}>{regime}</span>
    </div>
  );
}

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [sync, setSync] = useState<SyncInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, t, m, s] = await Promise.all([getPortfolio(), getTrades(), getMetrics(), getSyncInfo()]);
      if (p) setPortfolio(p);
      if (t) setTrades(t);
      if (m) setMetrics(m);
      if (s) setSync(s);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Loading Stratos...</div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">No portfolio data found</div>
      </div>
    );
  }

  const totalInvested = Object.values(portfolio.positions).reduce((sum, pos) => sum + pos.shares * pos.avg_price, 0);
  const cashRatio = portfolio.cash / portfolio.total_value;
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const totalReturn = latestMetric ? latestMetric.cumulative_return : 0;
  const sharpe = metrics.length > 1 ? (Math.sqrt(252) * metrics.reduce((s, m) => s + m.daily_return, 0) / metrics.length) / (Math.sqrt(metrics.reduce((s, m) => s + m.daily_return ** 2, 0) / metrics.length) + 1e-8) : 0;
  const maxDD = metrics.length > 0 ? Math.min(...metrics.map(m => m.drawdown)) : 0;
  const vix = latestMetric?.vix ?? 0;
  const regime = latestMetric?.regime ?? "N/A";
  const dataSource = latestMetric?.data_source ?? "N/A";

  const chartData = metrics.map(m => ({
    date: m.date.slice(5),
    value: Math.round(m.portfolio_value),
    returnPct: +(m.cumulative_return * 100).toFixed(2),
    drawdownPct: +(m.drawdown * 100).toFixed(2),
    vix: +m.vix.toFixed(1),
    cashPct: +(m.cash_ratio * 100).toFixed(1),
  }));

  const positions = Object.entries(portfolio.positions)
    .filter(([, pos]) => pos.shares > 0)
    .map(([symbol, pos]) => ({
      symbol,
      name: stockName(symbol),
      shares: pos.shares,
      avgPrice: pos.avg_price,
      value: pos.shares * pos.avg_price,
      weight: ((pos.shares * pos.avg_price) / portfolio.total_value * 100),
    }))
    .sort((a, b) => b.value - a.value);

  const recentTrades = [...trades].reverse().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-black text-xs font-bold">S</div>
            <span className="font-semibold text-sm tracking-wide">STRATOS</span>
            <span className="text-[10px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5 ml-1">v11.1</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {vix > 0 && <VixBadge vix={vix} regime={regime} />}
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              <span>{dataSource}</span>
            </div>
            {sync && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>{sync.last_sync ? new Date(sync.last_sync).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Client + Value Row */}
        <div className="animate-fade-up">
          <div className="flex items-baseline gap-3 mb-1">
            <h1 className="text-3xl font-bold tabular-nums">{fmt(portfolio.total_value)}</h1>
            <span className={`text-sm font-medium ${totalReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {pnlSign(totalReturn)}{pct(totalReturn)}
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            Palla Srinivasa Rao &middot; NSE 12-stock universe &middot; Since {portfolio.start_date || "—"}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <MetricCard
            label="Total Return"
            value={`${pnlSign(totalReturn)}${pct(totalReturn)}`}
            sub={fmt(portfolio.total_value - portfolio.corpus) + " P&L"}
            color={totalReturn >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={sharpe.toFixed(2)}
            sub="Annualized"
            color={sharpe > 1 ? "text-emerald-400" : sharpe > 0 ? "text-amber-400" : "text-red-400"}
          />
          <MetricCard
            label="Max Drawdown"
            value={pct(maxDD)}
            sub="Worst peak-to-trough"
            color={maxDD > -0.05 ? "text-emerald-400" : maxDD > -0.15 ? "text-amber-400" : "text-red-400"}
          />
          <MetricCard
            label="Cash Drag"
            value={pct(cashRatio)}
            sub={`Invested: ${pct(1 - cashRatio)}`}
            color={cashRatio <= 0.15 ? "text-emerald-400" : cashRatio <= 0.3 ? "text-amber-400" : "text-red-400"}
          />
        </div>

        {/* Charts */}
        {chartData.length > 1 && (
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {/* Portfolio Value */}
            <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Portfolio Value</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 100000).toFixed(1)}L`} />
                  <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #ffffff0a", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#a1a1aa" }} formatter={(v: number | string) => fmt(Number(v))} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#valueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {/* Cumulative Returns */}
              <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Cumulative Returns</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                    <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #ffffff0a", borderRadius: 8, fontSize: 12 }} formatter={(v: number | string) => `${Number(v).toFixed(2)}%`} />
                    <Area type="monotone" dataKey="returnPct" stroke="#3b82f6" fill="url(#retGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* VIX */}
              <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">India VIX</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 30]} />
                    <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #ffffff0a", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="vix" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.vix < 13 ? "#10b981" : entry.vix < 17 ? "#f59e0b" : entry.vix < 22 ? "#f97316" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Drawdown + Cash Allocation */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Drawdown</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                    <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #ffffff0a", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="drawdownPct" stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Cash Allocation</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 50]} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                    <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #ffffff0a", borderRadius: 8, fontSize: 12 }} formatter={(v: number | string) => `${Number(v).toFixed(1)}%`} />
                    <Area type="monotone" dataKey="cashPct" stroke="#8b5cf6" fill="url(#cashGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Positions */}
        {positions.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Positions</div>
            <div className="bg-[#111118] border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] uppercase tracking-widest text-zinc-500">
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-right py-3 px-4">Shares</th>
                    <th className="text-right py-3 px-4">Avg Price</th>
                    <th className="text-right py-3 px-4">Value</th>
                    <th className="text-right py-3 px-4">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.symbol} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-medium">{pos.name} <span className="text-zinc-600 text-xs ml-1">{pos.symbol}</span></td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{pos.shares.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{fmt(pos.avgPrice)}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{fmt(pos.value)}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{pos.weight.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2 px-4">
              <span>Cash: {fmt(portfolio.cash)} ({pct(cashRatio)})</span>
              <span>Invested: {fmt(totalInvested)} ({pct(1 - cashRatio)})</span>
            </div>
          </div>
        )}

        {/* Recent Trades */}
        {recentTrades.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Recent Trades</div>
            <div className="bg-[#111118] border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] uppercase tracking-widest text-zinc-500">
                    <th className="text-left py-3 px-4">Time</th>
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-center py-3 px-4">Side</th>
                    <th className="text-right py-3 px-4">Shares</th>
                    <th className="text-right py-3 px-4">Price</th>
                    <th className="text-right py-3 px-4">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 text-zinc-500 tabular-nums">{t.date} {t.time}</td>
                      <td className="py-2.5 px-4">{stockName(t.symbol)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${t.action === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {t.action === "BUY" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{Number(t.shares).toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{fmt(Number(t.price))}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{fmt(Number(t.value))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIX Allocation Table */}
        <div className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">VIX Allocation Model</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Calm", range: "< 13", equity: "95%", cash: "5%", color: "emerald" },
              { label: "Elevated", range: "13–17", equity: "80–95%", cash: "5–20%", color: "amber" },
              { label: "Stressed", range: "17–22", equity: "60–80%", cash: "20–40%", color: "orange" },
              { label: "Crisis", range: "> 22", equity: "10–25%", cash: "75–90%", color: "red" },
            ].map((r) => (
              <div key={r.label} className={`bg-[#111118] border border-white/5 rounded-xl p-4 ${r.label.toLowerCase() === regime.toLowerCase() ? "ring-1 ring-white/20" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full bg-${r.color}-400 ${r.label.toLowerCase() === regime.toLowerCase() ? "pulse-dot" : ""}`} />
                  <span className="text-sm font-medium">{r.label}</span>
                </div>
                <div className="text-xs text-zinc-500 mb-2">VIX {r.range}</div>
                <div className="text-lg font-semibold tabular-nums">{r.equity}</div>
                <div className="text-xs text-zinc-500">Cash: {r.cash}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600 pt-8 pb-4">
          Stratos AI Hedge Fund &middot; Paper Trading V11.1 &middot; Data: nsefetch → yfinance → mock &middot; Not SEBI registered &middot; Educational purposes only
        </div>
      </main>
    </div>
  );
}