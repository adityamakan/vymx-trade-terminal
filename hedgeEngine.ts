import { Asset } from '../types';

export interface HedgeSuggestion {
  name: string;
  symbol: string;
  reason: string;
}

export function generateHedgeSuggestions(asset: Asset): HedgeSuggestion[] {
  // Simple heuristic based on asset type or direction
  const isDown = asset.change < 0;
  const isCrypto = asset.type === 'crypto';
  const isHighVolatility = Math.abs(asset.change) > 3;

  const suggestions: HedgeSuggestion[] = [];

  if (isCrypto) {
    suggestions.push({ name: 'Bitcoin Out-of-the-money Put', symbol: 'BTC_PUT', reason: 'Directly hedges downside risk on high volatility crypto assets.' });
    suggestions.push({ name: 'US 10-Year Treasury', symbol: '^TNX', reason: 'A safe-haven asset that usually moves inversely to highly speculative tech/crypto assets.' });
    suggestions.push({ name: 'Gold Futures', symbol: 'GC=F', reason: 'Classic store of value when risk assets are under pressure.' });
  } else if (isDown) {
    // If the asset is currently crashing
    suggestions.push({ name: 'Gold Futures', symbol: 'GC=F', reason: 'Gold traditionally acts as a safe haven when equities face heavy drawdown pressure.' });
    suggestions.push({ name: 'VIX Volatility Index Call', symbol: '^VIX_CALL', reason: 'Profit from market panic as volatility spikes.' });
    suggestions.push({ name: 'Japanese Yen', symbol: 'JPY=X', reason: 'A classic funding currency that unwinds strongly during a risk-off global market shock.' });
  } else if (isHighVolatility) {
    // If it's volatile but not necessarily crashing (e.g. up big)
    suggestions.push({ name: 'Equal-Weight S&P 500', symbol: 'RSP', reason: 'Reduces concentration risk if this single asset reverses.' });
    suggestions.push({ name: 'Covered Call Strategy', symbol: `${asset.symbol}_CC`, reason: 'Generate income to offset potential near-term pullbacks after a significant rally.' });
    suggestions.push({ name: 'Consumer Staples ETF', symbol: 'XLP', reason: 'Pivot to defensive non-cyclical equities to maintain equity exposure with lower beta.' });
  } else {
    // Default / low volatility
    suggestions.push({ name: 'US Dollar Index', symbol: 'DX-Y.NYB', reason: 'General hedge against broad market or currency devaluation.' });
    suggestions.push({ name: 'Global Bonds ETF', symbol: 'BNDX', reason: 'Provides steady yield and lowers overall portfolio correlation.' });
    suggestions.push({ name: 'Utilities Sector ETF', symbol: 'XLU', reason: 'Defensive equity posture yielding dividends regardless of market direction.' });
  }

  return suggestions;
}
