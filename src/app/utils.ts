export function fmt(n: number, prefix = "₹"): string {
  if (n >= 1_00_00_000) return `${prefix}${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `${prefix}${(n / 1_00_000).toFixed(2)}L`;
  return `${prefix}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function pct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

export function regimeColor(regime: string): string {
  switch (regime) {
    case "CALM": return "text-emerald-400";
    case "ELEVATED": return "text-amber-400";
    case "STRESSED": return "text-orange-400";
    case "CRISIS": return "text-red-400";
    default: return "text-zinc-400";
  }
}

export function regimeBg(regime: string): string {
  switch (regime) {
    case "CALM": return "bg-emerald-500/10 border-emerald-500/20";
    case "ELEVATED": return "bg-amber-500/10 border-amber-500/20";
    case "STRESSED": return "bg-orange-500/10 border-orange-500/20";
    case "CRISIS": return "bg-red-500/10 border-red-500/20";
    default: return "bg-zinc-500/10 border-zinc-500/20";
  }
}

export function pnlColor(n: number): string {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-zinc-400";
}

export function pnlSign(n: number): string {
  return n >= 0 ? "+" : "";
}

const NSE_NAMES: Record<string, string> = {
  RELIANCE: "Reliance",
  TCS: "TCS",
  INFY: "Infosys",
  HDFCBANK: "HDFC Bank",
  ICICIBANK: "ICICI Bank",
  BHARTIARTL: "Bharti Airtel",
  ITC: "ITC",
  SBIN: "SBI",
  LT: "L&T",
  KOTAKBANK: "Kotak Bank",
  AXISBANK: "Axis Bank",
  ASIANPAINT: "Asian Paints",
};

export function stockName(s: string): string {
  return NSE_NAMES[s] || s;
}