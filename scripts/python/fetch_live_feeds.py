import yfinance as yf
import json
import sys
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def fetch_market_snapshot():
    tickers = ['.SPX', '^GSPC', '^IXIC', '^DJI', '^NSEI', 'BTC-USD', 'ETH-USD', 'GC=F', 'CL=F']
    data = {}
    try:
        df = yf.download(tickers=tickers, period="2d", interval="1d", progress=False)
        for ticker in tickers:
            try:
                close_prices = df['Close'][ticker].dropna()
                if len(close_prices) >= 2:
                    prev, curr = close_prices.iloc[-2], close_prices.iloc[-1]
                    pct_change = round(((curr - prev) / prev) * 100, 2)
                    data[ticker] = {"price": round(curr, 2), "change_pct": pct_change}
            except Exception:
                continue
    except Exception as e:
        data["error"] = str(e)
    return data

if __name__ == "__main__":
    result = {"market": fetch_market_snapshot()}
    print(json.dumps(result))
