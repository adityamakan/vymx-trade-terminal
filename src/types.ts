export interface Asset {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'index' | 'bond';
  price: number; // Zero until a fresh provider quote is received; never use without quoteAsOf validation.
  currency?: string | null; // Provider-reported quote currency; null until verified.
  quoteAsOf?: string | null; // Provider observation timestamp; null until a verified quote is received.
  change: number | null; // provider-reported percentage change; null when unavailable
  changeAbs: number | null; // provider-reported absolute change; null when unavailable
  marketCap: number; // Zero sentinel until provider fundamentals are connected; not a ranking input.
  marketCapDisplay: string; // 'N/A' until provider fundamentals are connected.
  peRatio: number | null; // null for cryptos, forex, some index
  sector: string; // e.g. "Technology", "Financials", "DeFi", "Energy", "Metal", "Currencies", "Indices"
  country: string; // e.g. "United States", "Global", "Germany", "Japan", "Switzerland"
  volume: number | null; // null until supplied by the provider.
  volumeDisplay: string; // 'N/A' until supplied by the provider.
  high52w: number; // Zero sentinel until provider quote metadata is available.
  low52w: number; // Zero sentinel until provider quote metadata is available.
  openPrice: number; // Zero sentinel until provider quote metadata is available.
  prevClose: number; // Zero sentinel until provider quote metadata is available.
}

export interface PortfolioItem {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'index' | 'bond';
  avgBuyPrice: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  date: string;
  note?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  url?: string;
  symbolAffected?: string;
}

export interface ScreenerFilters {
  marketCap: string; // 'all' | 'micro' | 'mid' | 'large' | 'mega'
  sector: string; // 'all' or specific sectors
  peRatio: string; // 'all' | 'undervalued' | 'reasonable' | 'premium'
  country: string; // 'all' or specific countries
  assetType: 'all' | 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond';
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  active: boolean;
}

