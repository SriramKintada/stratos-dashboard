"""
Sync portfolio data to stratos-dashboard/public/ for Vercel deployment.
Run this after each engine cycle or on a schedule.
"""
import json
import csv
import pathlib
import datetime

DATA_DIR = pathlib.Path(__file__).parent.parent / "paper_trading_data"
PUBLIC_DIR = pathlib.Path(__file__).parent / "public"

PORTFOLIO_FILE = DATA_DIR / "portfolio_state.json"
TRADES_FILE = DATA_DIR / "trades.csv"
METRICS_FILE = DATA_DIR / "metrics_history.csv"


def sync():
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    
    # Portfolio state
    if PORTFOLIO_FILE.exists():
        with open(PORTFOLIO_FILE) as f:
            portfolio = json.load(f)
        with open(PUBLIC_DIR / "portfolio.json", "w") as f:
            json.dump(portfolio, f, indent=2, default=str)
        print(f"Synced portfolio: Rs.{portfolio.get('total_value', 0):,.0f}")
    
    # Trades
    if TRADES_FILE.exists():
        trades = []
        with open(TRADES_FILE) as f:
            reader = csv.DictReader(f)
            for row in reader:
                trades.append(row)
        # Last 50 trades
        with open(PUBLIC_DIR / "trades.json", "w") as f:
            json.dump(trades[-50:], f, indent=2, default=str)
        print(f"Synced {len(trades)} trades (last 50)")
    
    # Metrics
    if METRICS_FILE.exists():
        metrics = []
        with open(METRICS_FILE) as f:
            reader = csv.DictReader(f)
            for row in reader:
                metrics.append(row)
        with open(PUBLIC_DIR / "metrics.json", "w") as f:
            json.dump(metrics, f, indent=2, default=str)
        print(f"Synced {len(metrics)} days of metrics")
    
    # Timestamp
    with open(PUBLIC_DIR / "last_sync.json", "w") as f:
        json.dump({"last_sync": str(datetime.datetime.now()), "version": "v11.1"}, f, indent=2)
    print("Sync complete.")


if __name__ == "__main__":
    sync()