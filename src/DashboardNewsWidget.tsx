import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, RefreshCw, ChevronRight } from 'lucide-react';
import { NewsArticle } from '../types';

export default function DashboardNewsWidget() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/live-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: 'us' })
      });
      const data = await response.json();
      if (data.articles && data.articles.length > 0) {
        setNews(data.articles);
      }
    } catch (e) {
      // Silenced fallback;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
           <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
             <Newspaper className="h-3 w-3 text-indigo-400" />
           </div>
           <h2 className="text-xs font-black tracking-widest uppercase text-white font-mono">Global Intel Feed</h2>
        </div>
        <button onClick={fetchNews} className="text-zinc-500 hover:text-white transition-colors" disabled={loading}>
           <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {loading && news.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-indigo-500/50">
             <RefreshCw className="h-5 w-5 animate-spin" />
             <span className="text-[10px] font-mono uppercase tracking-widest">Intercepting News Vectors...</span>
          </div>
        ) : (
          news.map((article, idx) => (
            <div key={`${article.id}-${idx}`} className="group p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/50 hover:bg-zinc-900 transition-all duration-300 cursor-pointer hover:border-indigo-500/30 hover:shadow-lg">
               <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{article.source}</span>
                     <span className="text-[10px] text-zinc-600 font-mono">— {article.time}</span>
                  </div>
                  {article.sentiment && (
                     <div className={`flex items-center justify-center w-5 h-5 rounded-full ${
                        article.sentiment === 'positive' ? 'bg-emerald-500/10' :
                        article.sentiment === 'negative' ? 'bg-rose-500/10' : 'bg-zinc-800'
                     }`}>
                        {article.sentiment === 'positive' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                        {article.sentiment === 'negative' && <TrendingDown className="w-3 h-3 text-rose-400" />}
                     </div>
                  )}
               </div>
               <h3 className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors line-clamp-2 leading-relaxed mb-3">
                 {article.title}
               </h3>
               {article.symbolAffected && (
                 <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border transition-colors ${
                      article.sentiment === 'positive' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                      article.sentiment === 'negative' ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' :
                      'border-zinc-700 bg-zinc-800 text-zinc-400 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 group-hover:text-indigo-300'
                    }`}>
                       {article.symbolAffected}
                    </span>
                 </div>
               )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
