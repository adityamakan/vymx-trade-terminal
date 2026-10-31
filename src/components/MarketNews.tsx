import React, { useCallback, useEffect, useState } from 'react';
import { Newspaper, Clock, RefreshCcw, Globe, AlertCircle, ExternalLink } from 'lucide-react';

interface NewsArticle {
  id: string | number;
  title: string;
  source: string;
  time: string | null;
  symbolAffected?: string | null;
  summary?: string;
  url?: string | null;
}

interface NewsResponse {
  success?: boolean;
  articles?: NewsArticle[];
  source?: string;
  fetchedAt?: string;
  error?: string;
}

export default function MarketNews() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/live-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: 'us' }),
        signal: AbortSignal.timeout(12_000)
      });
      const data = await response.json() as NewsResponse;
      if (!response.ok || !Array.isArray(data.articles)) {
        throw new Error(data.error || 'The configured news provider is unavailable.');
      }

      const validArticles = data.articles.filter((article) =>
        typeof article.title === 'string' &&
        article.title.trim().length > 0 &&
        typeof article.source === 'string' &&
        article.source.trim().length > 0
      );
      setNews(validArticles);
      setSource(data.source || null);
      setLastFetchedAt(data.fetchedAt || new Date().toISOString());
      if (validArticles.length === 0) {
        setError('The news provider returned no articles. No sample or synthetic headlines are displayed.');
      }
    } catch (fetchError) {
      setNews([]);
      setSource(null);
      setLastFetchedAt(null);
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to retrieve verified news.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchNews();
  }, [fetchNews]);

  const formatTimestamp = (value: string | null) => {
    if (!value) return 'Publication time unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
            <p className="text-sm text-zinc-500 mt-1">Provider-sourced headlines. Availability and publication times depend on the configured feed.</p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2 text-xs font-mono">
          <div className="text-zinc-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {lastFetchedAt ? `Retrieved: ${formatTimestamp(lastFetchedAt)}` : 'Not yet retrieved'}
          </div>
          <button
            onClick={() => void fetchNews()}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {source && (
        <div className="text-[11px] text-zinc-500 font-mono">Source: {source} · Headlines are not independently sentiment-scored by this feed.</div>
      )}

      {error && (
        <div role="status" className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 text-sm text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <div>{error}</div>
        </div>
      )}

      {isRefreshing && news.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-8 text-center text-sm text-zinc-400">
          Retrieving headlines from the configured provider…
        </div>
      )}

      {!isRefreshing && news.length === 0 && !error && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-8 text-center space-y-2">
          <Globe className="h-7 w-7 mx-auto text-zinc-600" />
          <p className="text-sm text-zinc-300">No verified news is currently available.</p>
          <p className="text-xs text-zinc-500">VYMX does not substitute generated or sample headlines for provider data.</p>
        </div>
      )}

      <div className="space-y-3">
        {news.map((article, index) => (
          <article
            key={String(article.id || `${article.title}-${index}`)}
            className="rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-5 hover:border-zinc-700 transition-colors"
          >
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] font-mono text-zinc-500">
              <span className="text-indigo-300 font-bold uppercase">{article.source}</span>
              <span>•</span>
              <span>{formatTimestamp(article.time)}</span>
              {article.symbolAffected && <><span>•</span><span>Related: {article.symbolAffected}</span></>}
            </div>
            <h2 className="text-base font-semibold text-zinc-100 mb-2">{article.title}</h2>
            {article.summary && <p className="text-sm leading-relaxed text-zinc-400">{article.summary}</p>}
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-indigo-300 hover:text-indigo-200"
              >
                Read source <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
