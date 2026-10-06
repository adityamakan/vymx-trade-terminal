import sys
import json
import numpy as np
import pandas as pd
import yfinance as yf
from pypfopt import EfficientFrontier, risk_models, expected_returns
from arch import arch_model

def get_portfolio_optimization(tickers):
    data = yf.download(tickers, period="1y")["Close"]
    mu = expected_returns.mean_historical_return(data)
    S = risk_models.sample_cov(data)
    ef = EfficientFrontier(mu, S)
    weights = ef.max_sharpe()
    return ef.clean_weights()

def forecast_garch_volatility(ticker):
    df = yf.Ticker(ticker).history(period="1y")
    returns = 100 * df["Close"].pct_change().dropna()
    model = arch_model(returns, vol="Garch", p=1, q=1)
    res = model.fit(disp="off")
    forecast = res.forecast(horizon=5)
    return float(np.sqrt(forecast.variance.iloc[-1].values[-1]))

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action == "optimize":
        tickers = sys.argv[2].split(",") if len(sys.argv) > 2 else ["AAPL", "MSFT", "NVDA", "GOOGL"]
        print(json.dumps(get_portfolio_optimization(tickers)))
    elif action == "volatility":
        ticker = sys.argv[2] if len(sys.argv) > 2 else "AAPL"
        print(json.dumps({"ticker": ticker, "garch_volatility": forecast_garch_volatility(ticker)}))
    else:
        print(json.dumps({"status": "Quant Engine Active", "supported_actions": ["optimize", "volatility"]}))

