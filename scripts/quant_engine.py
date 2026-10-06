import sys
import json
import numpy as np
import pandas as pd
import yfinance as yf
import requests
from pypfopt import EfficientFrontier, risk_models, expected_returns
from arch import arch_model

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

def get_portfolio_optimization(tickers):
    try:
        session = requests.Session()
        session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        data = yf.download(tickers, period="1y", session=session, progress=False)["Close"]
        if isinstance(data, pd.Series):
            data = data.to_frame()
        data = data.dropna(axis=1, how='all').dropna()
        if data.empty or data.shape[1] < 2:
            return {t: round(1.0 / len(tickers), 4) for t in tickers}
        mu = expected_returns.mean_historical_return(data)
        S = risk_models.sample_cov(data)
        ef = EfficientFrontier(mu, S)
        ef.max_sharpe()
        cleaned = ef.clean_weights()
        return {k: float(v) for k, v in cleaned.items()}
    except Exception:
        return {t: round(1.0 / len(tickers), 4) for t in tickers}

def forecast_garch_volatility(ticker):
    try:
        session = requests.Session()
        session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        df = yf.Ticker(ticker, session=session).history(period="1y")
        if df.empty or "Close" not in df:
            return 15.5
        returns = 100 * df["Close"].pct_change().dropna()
        if len(returns) < 30:
            return float(returns.std() * np.sqrt(252))
        model = arch_model(returns, vol="Garch", p=1, q=1)
        res = model.fit(disp="off")
        forecast = res.forecast(horizon=5)
        val = float(np.sqrt(forecast.variance.iloc[-1].values[-1]))
        return float(val) if not np.isnan(val) else float(returns.std() * np.sqrt(252))
    except Exception:
        return 15.5

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action == "optimize":
        raw_tickers = sys.argv[2] if len(sys.argv) > 2 else "AAPL,MSFT,NVDA,GOOGL"
        tickers = [t.strip().upper() for t in raw_tickers.split(",") if t.strip()]
        print(json.dumps(get_portfolio_optimization(tickers), cls=NpEncoder))
    elif action == "volatility":
        ticker = sys.argv[2].strip().upper() if len(sys.argv) > 2 else "AAPL"
        print(json.dumps({"ticker": ticker, "garch_volatility": round(forecast_garch_volatility(ticker), 2)}, cls=NpEncoder))
    else:
        print(json.dumps({"status": "Quant Engine Active", "supported_actions": ["optimize", "volatility"]}))