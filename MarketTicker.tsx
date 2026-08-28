import React, { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { NewsArticle } from '../types';

export default function MarketTicker() {
  const [headlines, setHeadlines] = useState<NewsArticle[]>([]);
  
  useEffect(() => {
    // Fetch live news for the ticker
    const fetchTickerNews = async () => {
      try {
        const response = await fetch('/api/ai/live-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ market: 'us' })
        });
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          setHeadlines(data.articles);
        }
      } catch (e) {
        // Silenced error
      }
    };
    
    fetchTickerNews();
    const intervalId = setInterval(fetchTickerNews, 60000 * 5); // Refresh every 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  if (headlines.length === 0) return null;

  return (
    <div className="w-full bg-zinc-950 border-b border-indigo-500/10 overflow-hidden relative flex items-center h-10 px-4 group shadow-[0_0_15px_rgba(99,102,241,0.05)]">
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-4 bg-gradient-to-r from-zinc-950 via-zinc-950 to-transparent pr-12">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/30 mr-3 animate-pulse-slow">
           <Newspaper className="w-3 h-3 text-indigo-400" />
        </div>
        <span className="text-[10px] font-black text-indigo-100 tracking-[0.2em] uppercase font-mono shadow-indigo-500/50 drop-shadow-md">LIVE TELEMETRY</span>
      </div>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center pl-48">
        <div className="flex items-center whitespace-nowrap animate-ticker group-hover:[animation-play-state:paused]">
          {[...headlines, ...headlines].map((article, i) => (
            <div key={`${article.id}-${i}`} className="flex items-center mx-6">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded mr-3 uppercase tracking-wider border ${
                article.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                article.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                'bg-zinc-800/50 text-zinc-400 border-zinc-700'
              }`}>
                {article.symbolAffected || 'GLOBAL'}
              </span>
              <span className="text-xs text-zinc-200 font-medium mr-2 tracking-wide drop-shadow-sm">{article.title}</span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase ml-1">— {article.source}</span>
              {i < headlines.length * 2 - 1 && (
                <span className="mx-8 text-indigo-500/40 text-[10px] opacity-50">♦</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
