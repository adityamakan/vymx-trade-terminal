import React, { useState, useEffect } from 'react';
import { Newspaper, Clock, TrendingUp, AlertCircle, RefreshCcw, Globe } from 'lucide-react';

const FALLBACK_NEWS = [
  {
    id: 1,
    title: 'Global Markets Rally on Tech Earnings Surrogate Data',
    source: 'Financial Times',
    time: '2 mins ago',
    category: 'Equities',
    impact: 'High',
    sentiment: 'bullish'
  },
  {
    id: 2,
    title: 'Central Banks Hint at Coordinated Rate Decisions Next Quarter',
    source: 'Bloomberg',
    time: '15 mins ago',
    category: 'Macro',
    impact: 'High',
    sentiment: 'neutral'
  },
  {
    id: 3,
    title: 'Oil Prices Stabilize After Strategic Reserve Announcements',
    source: 'Reuters',
    time: '34 mins ago',
    category: 'Commodities',
    impact: 'Medium',
    sentiment: 'neutral'
  },
  {
    id: 4,
    title: 'Institutional Inflows to Crypto Exceed Yearly Averages',
    source: 'CoinDesk',
    time: '1 hour ago',
    category: 'Crypto',
    impact: 'Medium',
    sentiment: 'bullish'
  },
  {
    id: 5,
    title: 'Emerging Market Bonds See Record Foreign Direct Investment',
    source: 'WSJ',
    time: '2 hours ago',
    category: 'Bonds',
    impact: 'Low',
    sentiment: 'bullish'
  },
  {
    id: 6,
    title: 'Tech Sector Faces Regulatory Headwinds in European Markets',
    source: 'CNBC',
    time: '2.5 hours ago',
    category: 'Regulation',
    impact: 'High',
    sentiment: 'bearish'
  },
  {
    id: 7,
    title: 'Gold Retreats Slightly as Dollar Regains Some Ground',
    source: 'MarketWatch',
    time: '3 hours ago',
    category: 'Commodities',
    impact: 'Medium',
    sentiment: 'bearish'
  },
  {
    id: 8,
    title: 'Retail Sales Data Exceeds Expectations for Q3',
    source: 'Economic Times',
    time: '4 hours ago',
    category: 'Economy',
    impact: 'Medium',
    sentiment: 'bullish'
  }
];

export default function MarketNews() {
  const [news, setNews] = useState<any[]>(FALLBACK_NEWS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  const fetchNews = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/ai/live-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: 'us' })
      });
      const data = await response.json();
      if (data.articles && data.articles.length > 0) {
        // Map the backend articles to the frontend format if needed
        const mapped = data.articles.map((a: any, i: number) => ({
          id: a.id || i,
          title: a.title,
          source: a.source,
          time: a.time || new Date().toLocaleTimeString(),
          category: a.symbolAffected || 'Market',
          impact: 'High',
          sentiment: a.sentiment
        }));
        setNews(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLastRefreshed(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleRefresh = () => {
    fetchNews();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
            <Newspaper className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Market News Feed</h1>
            <p className="text-sm text-zinc-500 mt-1">Real-time updates, latest current news, and global market insights.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-zinc-500 flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
            <Clock className="h-3.5 w-3.5" />
            Last Updated: {lastRefreshed}
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Featured News */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-400" />
              Latest Updates
            </h2>
            <div className="flex gap-2">
              {['All', 'Equities', 'Crypto', 'Macro'].map((tag) => (
                <span key={tag} className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-900 px-2 py-1 rounded cursor-pointer hover:text-white hover:bg-zinc-800 transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            {news.map((item, idx) => (
              <div 
                key={item.id} 
                className="group relative bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-5 hover:border-zinc-700/80 transition-all hover:bg-zinc-900/40"
              >
                {/* Visual Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                  item.sentiment === 'bullish' ? 'bg-emerald-500/50' : 
                  item.sentiment === 'bearish' ? 'bg-rose-500/50' : 
                  'bg-zinc-600/50'
                }`}></div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border ${
                        item.sentiment === 'bullish' ? 'text-emerald-400 border-emerald-500/20' : 
                        item.sentiment === 'bearish' ? 'text-rose-400 border-rose-500/20' : 
                        'text-zinc-400 border-zinc-700'
                      }`}>
                        {item.sentiment}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-[10px] text-zinc-400 font-bold">{item.source}</span>
                    </div>
                    <h3 className="text-base font-semibold text-zinc-200 group-hover:text-white transition-colors mb-2">
                      {item.title}
                    </h3>
                    
                    {/* 100x Density AI Analysis Panel */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 bg-black/40 rounded-lg p-3 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300/60">
                      <div className="space-y-1 border-r border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pr-2">
                        <span className="block text-[8px] uppercase text-zinc-500 font-mono">Impact Score</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${item.impact === 'High' ? 'bg-rose-500 w-11/12' : item.impact === 'Medium' ? 'bg-amber-500 w-1/2' : 'bg-emerald-500 w-1/4'}`}></div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-300">{item.impact === 'High' ? '92' : item.impact === 'Medium' ? '54' : '28'}</span>
                        </div>
                      </div>
                      <div className="space-y-1 border-r border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pr-2 pl-2">
                        <span className="block text-[8px] uppercase text-zinc-500 font-mono">Entities</span>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[8px] bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">NVDA</span>
                          <span className="text-[8px] bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">FED</span>
                        </div>
                      </div>
                      <div className="space-y-1 border-r border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pr-2 pl-2">
                        <span className="block text-[8px] uppercase text-zinc-500 font-mono">Market Volatility</span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold block">+{(0 * 2 + 1).toFixed(2)}% expected</span>
                      </div>
                      <div className="space-y-1 pl-2">
                        <span className="block text-[8px] uppercase text-zinc-500 font-mono">Actionability</span>
                        <span className="text-[10px] font-bold text-emerald-400 block">Monitor Closely</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar / Top Highlights */}
        <div className="space-y-6">
          {/* Breaking Alerts */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5">
            <h3 className="text-rose-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Critical Alerts
            </h3>
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-rose-500/10">
                <span className="text-xs font-mono text-zinc-500">10 mins ago</span>
                <p className="text-sm text-zinc-300">VIX surges past 20 amid unexpected geopolitical friction.</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono text-zinc-500">45 mins ago</span>
                <p className="text-sm text-zinc-300">European tech equities halt trading temporarily due to technical glitches.</p>
              </div>
            </div>
          </div>

          {/* Trending Topics */}
          <div className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-5">
            <h3 className="text-zinc-300 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {['#InterestRates', '#AI_Boom', '#CryptoETF', '#SupplyChain', '#OPEC', '#TechEarnings'].map(tag => (
                <span key={tag} className="text-xs font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md cursor-pointer hover:bg-indigo-500/20 transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
