export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export interface Asset {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'index' | 'bond';
  price: number;
  change: number; // percentage change, e.g. 1.25 or -0.84
  changeAbs: number; // absolute change, e.g. 5.12 or -1.20
  marketCap: number; // in Millions for smaller or Billions for larger, let's double specify standard
  marketCapDisplay: string; // e.g. "3.25T" or "45.2B" or "890M"
  peRatio: number | null; // null for cryptos, forex, some index
  sector: string; // e.g. "Technology", "Financials", "DeFi", "Energy", "Metal", "Currencies", "Indices"
  country: string; // e.g. "United States", "Global", "Germany", "Japan", "Switzerland"
  volume: number; // e.g. 24h volume
  volumeDisplay: string; // e.g. "52.4M"
  high52w: number;
  low52w: number;
  openPrice: number;
  prevClose: number;
  history: {
    [key: string]: HistoricalDataPoint[]; // '1D' | '1W' | '1M' | '1Y'
  };
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
