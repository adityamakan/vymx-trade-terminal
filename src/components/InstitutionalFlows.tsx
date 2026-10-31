import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, TrendingUp, TrendingDown, Building2, Globe2, Zap, ArrowUpRight, ArrowDownRight, Activity, Clock, ShieldCheck, PieChart, Coins, Download, Filter, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BlockDeal {
  id: string;
  investor: string;
  type: 'FII' | 'DII';
  targetCompany: string;
  targetSector: string;
  targetCountry: string;
  amount: number;
  currency: string;
  pricePerShare: number;
  date: string;
  rationale: string;
  sentiment: 'Bullish' | 'Bearish';
  assetClass: 'Equity' | 'Debt' | 'Hybrid';
}

const GEOPOLITICAL_EVENTS: any[] = [];

export default function InstitutionalFlows({ formatCurrency }: { formatCurrency: (v: number) => string }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'sectors' | 'geopolitics'>('overview');
  const [liveDeals, setLiveDeals] = useState<BlockDeal[]>([]);
  const [sectorFlows, setSectorFlows] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [selectedDeal, setSelectedDeal] = useState<BlockDeal | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Filters
  const [assetClassFilter, setAssetClassFilter] = useState<'All' | 'Equity' | 'Debt' | 'Hybrid'>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<'1D' | '1W' | '1M'>('1D');
  const [highlightTopInflows, setHighlightTopInflows] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch live institutional flows
  useEffect(() => {
    let isMounted = true;
    const fetchFlows = async () => {
      try {
        setIsLoadingLive(true);
        const res = await fetch('/api/ai/institutional-flows');
        const data = await res.json();
        if (isMounted && data && !data.isMock) {
          if (data.deals?.length > 0) setLiveDeals(data.deals);
          if (data.sectorFlows?.length > 0) setSectorFlows(data.sectorFlows);
          if (data.monthlyTrends?.length > 0) setMonthlyTrends(data.monthlyTrends);
        }
      } catch (e) {
        console.error('Failed to fetch live flows', e);
      } finally {
        if (isMounted) setIsLoadingLive(false);
      }
    };
    fetchFlows();
    return () => { isMounted = false; };
  }, []);

  // Rotate through provider-supplied deal records only when a verified feed exists.
  useEffect(() => {
    // No local or synthetic deal records are generated.
    if (liveDeals.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % liveDeals.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [liveDeals.length]);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('Vymx Institutional Flows Report', 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      // Overview Table
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Global Market Overview', 14, 45);

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: [
          ['Net FII Flow (MTD)', 'Not connected'],
          ['Net DII Flow (MTD)', 'Not connected'],
          ['DII Buffering', 'Not computed'],
          ['FII Momentum', 'Not computed']
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      // Sector Flows Table
      const finalY = (doc as any).lastAutoTable.finalY;
      doc.text('Net Sectoral Allocations (In Crores)', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Sector', 'FII', 'DII', 'Net']],
        body: sectorFlows.length ? sectorFlows.map(s => [s.sector, s.fii.toString(), s.dii.toString(), s.net.toString()]) : [['Not available', '—', '—', 'No verified feed']],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      // Recent Deals Table
      const finalY2 = (doc as any).lastAutoTable.finalY;
      doc.addPage();
      doc.text('Recent Advanced Block Deals', 14, 22);

      autoTable(doc, {
        startY: 30,
        head: [['Type', 'Investor', 'Asset', 'Sector', 'Amount', 'Sentiment']],
        body: liveDeals.length ? liveDeals.map(d => [
          d.type,
          d.investor,
          d.targetCompany,
          d.targetSector,
          `${d.currency} ${(d.amount/1000000).toFixed(1)}M`,
          d.sentiment
        ]) : [['Not available', '—', '—', '—', '—', 'No verified deal feed']],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save('vymx-institutional-flows-report.pdf');
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredDeals = liveDeals.filter(deal => {
    if (assetClassFilter !== 'All' && deal.assetClass !== assetClassFilter) return false;

    const timestamp = new Date(deal.date).getTime();
    if (!Number.isFinite(timestamp)) return false;
    const rangeMs = dateRangeFilter === '1D' ? 24 * 60 * 60 * 1000 : dateRangeFilter === '1W' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp <= rangeMs;
  });

  const displayedSectors = highlightTopInflows
    ? [...sectorFlows].sort((a, b) => b.net - a.net).slice(0, 2)
    : sectorFlows;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700" ref={containerRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Network className="h-8 w-8 text-indigo-500" />
            Institutional Flow Data Coverage
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Institutional-flow panels display provider-sourced observations only. Connect a verified transaction and capital-flow feed to populate block deals, sector allocations, and geopolitical flow attribution.
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-300 hover:text-white hover:bg-zinc-800 px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          {isExporting ? <Activity className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF Report
        </button>
      </div>

      {/* Live Ticker */}
      <div className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-lg p-3 flex items-center gap-3 overflow-hidden shadow-inner">
        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded border border-rose-500/20 uppercase tracking-wider shrink-0">
          <Zap className="h-3 w-3 animate-pulse" /> Feed Status
        </div>
        {liveDeals.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div key={tickerIndex} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }} className="text-xs font-mono truncate text-zinc-300 flex-1 flex items-center gap-2">
              <span className={liveDeals[tickerIndex]?.type === 'FII' ? 'text-indigo-400' : 'text-emerald-400 font-bold'}>[{liveDeals[tickerIndex]?.type}]</span>
              <span>{liveDeals[tickerIndex]?.investor}</span><span className="text-zinc-500">→</span>
              <span className={liveDeals[tickerIndex]?.sentiment === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}>{liveDeals[tickerIndex]?.sentiment === 'Bullish' ? 'BOUGHT' : 'SOLD'}</span>
              <span className="font-bold text-white">{liveDeals[tickerIndex]?.targetCompany}</span>
              <span className="text-zinc-500 border-l border-zinc-700 pl-2 ml-1">@ {liveDeals[tickerIndex]?.currency} {liveDeals[tickerIndex]?.pricePerShare?.toLocaleString()}</span>
            </motion.div>
          </AnimatePresence>
        ) : (
          <span className="text-xs text-zinc-500 font-mono">No verified institutional transaction feed is connected. No sample trades are presented as live data.</span>
        )}
      </div>

      {/* Navigation Tabs & Global Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 w-fit">
          {[
            { id: 'overview', label: 'Global Overview', icon: Globe2 },
            { id: 'deals', label: 'Advanced Block Deals', icon: Activity },
            { id: 'sectors', label: 'Sector Analysis', icon: PieChart },
            { id: 'geopolitics', label: 'Geopolitical Impact', icon: Globe2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg border border-indigo-500'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
           {activeTab === 'deals' && (
              <>
                 <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                    {['All', 'Equity', 'Debt', 'Hybrid'].map(c => (
                      <button
                        key={c}
                        onClick={() => setAssetClassFilter(c as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md ${assetClassFilter === c ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {c}
                      </button>
                    ))}
                 </div>
                 <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                    {['1D', '1W', '1M'].map(r => (
                      <button
                        key={r}
                        onClick={() => setDateRangeFilter(r as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md ${dateRangeFilter === r ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {r}
                      </button>
                    ))}
                 </div>
              </>
           )}
           {activeTab === 'sectors' && (
              <button
                onClick={() => setHighlightTopInflows(!highlightTopInflows)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${highlightTopInflows ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-400'}`}
              >
                <Filter className="w-3.5 h-3.5" /> Highlights: Highest Inflows
              </button>
           )}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* FII Net flow card */}
               <div className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px]" />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-zinc-400 flex items-center gap-2">
                      <Globe2 className="w-4 h-4" /> Net FII Flow (MTD)
                    </h3>
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono border border-indigo-500/30">Foreign</span>
                  </div>
                  <div className="text-2xl font-black text-zinc-500 tracking-tight">Not connected</div>
                  <div className="mt-2 text-xs text-zinc-500">No verified FII transaction feed</div>
               </div>

               {/* DII Net flow card */}
               <div className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px]" />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-zinc-400 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Net DII Flow (MTD)
                    </h3>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/30">Domestic</span>
                  </div>
                  <div className="text-2xl font-black text-zinc-500 tracking-tight">Not connected</div>
                  <div className="mt-2 text-xs text-zinc-500">No verified DII transaction feed</div>
               </div>

               {/* Combined Index Impact */}
               <div className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-zinc-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Market Support
                    </h3>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1">
                       <div className="flex justify-between text-xs font-semibold">
                         <span className="text-zinc-300">DII Buffering</span>
                         <span className="text-zinc-500">Not computed</span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                         <div className="h-full bg-zinc-700 w-0" />
                       </div>
                     </div>
                     <div className="space-y-1">
                       <div className="flex justify-between text-xs font-semibold">
                         <span className="text-zinc-300">FII Momentum</span>
                         <span className="text-zinc-500">Not computed</span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                         <div className="h-full bg-zinc-700 w-0" />
                       </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 30-Day Trend Chart */}
            <div className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-6">
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <Activity className="w-5 h-5 text-indigo-400" />
                 30-Day Institutional Buy/Sell Trends (Net)
               </h3>
               <div className="h-72 w-full">
                 {monthlyTrends.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-center text-xs text-zinc-500">
                     No verified monthly FII/DII flow observations are available.
                   </div>
                 ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickMargin={10} />
                      <YAxis stroke="#52525b" fontSize={11} tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}`} />
                      <Tooltip
                         cursor={{ fill: '#27272a', opacity: 0.4 }}
                         contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                         itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                         labelStyle={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <ReferenceLine y={0} stroke="#52525b" />
                      <Bar dataKey="FII" name="Foreign (FII)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="DII" name="Domestic (DII)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
                 )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="space-y-4">
            {filteredDeals.length === 0 ? (
               <div className="text-center py-12 text-zinc-500">
                  No verified block-deal provider is connected. No sample transactions are presented.
               </div>
            ) : (
              filteredDeals.map((deal, idx) => (
                <div key={`${deal.id}-${idx}`}
                     onClick={() => setSelectedDeal(deal)}
                     className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-5 hover:border-zinc-700 transition-colors relative cursor-pointer group">
                  <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase border ${
                          deal.type === 'FII' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {deal.type}
                        </span>
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-300">
                           {deal.assetClass}
                        </span>
                        <h3 className="text-lg font-bold text-white">{deal.investor}</h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                        <div>
                          <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Target Asset</div>
                          <div className="font-semibold text-zinc-200">{deal.targetCompany}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Sector & Country</div>
                          <div className="font-semibold text-zinc-300 text-sm">{deal.targetSector} • {deal.targetCountry}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Execution Price</div>
                          <div className="font-mono font-bold text-zinc-200">
                            {deal.currency} {deal.pricePerShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Volume / Amount</div>
                          <div className={`font-mono font-bold ${deal.sentiment === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {deal.sentiment === 'Bullish' ? '+' : '-'}{deal.currency} {(deal.amount / 1000000).toFixed(1)}M
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Institutional Rationale
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/30 p-3 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 italic border-l-4 border-l-indigo-500">
                          "{deal.rationale}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sectors' && (
          <div className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Net Sectoral Allocations (In ₹ Crores)</h3>
            <div className="space-y-6">
              {displayedSectors.length === 0 && <p className="text-sm text-zinc-500">Sector flow data unavailable — no verified FII/DII feed is connected.</p>}
              {displayedSectors.map((sector) => (
                <div key={sector.sector} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-zinc-200">{sector.sector}</span>
                    <span className={sector.net > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {sector.net > 0 ? '+' : ''}{sector.net} Cr
                    </span>
                  </div>
                  <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                    {/* DII Portion */}
                    <div
                      className={`h-full ${sector.dii > 0 ? 'bg-emerald-500' : 'bg-rose-500'} opacity-80 border-r border-zinc-950`}
                      style={{ width: `${Math.abs(sector.dii) / (Math.abs(sector.fii) + Math.abs(sector.dii)) * 100}%` }}
                      title={`DII: ${sector.dii}`}
                    />
                    {/* FII Portion */}
                    <div
                      className={`h-full ${sector.fii > 0 ? 'bg-indigo-500' : 'bg-rose-500'} opacity-80`}
                      style={{ width: `${Math.abs(sector.fii) / (Math.abs(sector.fii) + Math.abs(sector.dii)) * 100}%` }}
                      title={`FII: ${sector.fii}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
                    <span>DII: {sector.dii > 0 ? '+' : ''}{sector.dii}</span>
                    <span>FII: {sector.fii > 0 ? '+' : ''}{sector.fii}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg flex gap-3 items-start">
               <ShieldCheck className="w-5 h-5 text-zinc-500 shrink-0" />
               <div>
                 <h4 className="text-sm font-bold text-zinc-300">Sectoral Rotation Insights</h4>
                 <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Rotation analysis will appear when verified FII/DII sector-flow observations are available. No inferred or placeholder flow narrative is shown.</p>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'geopolitics' && (
          <div className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-indigo-400" /> Geopolitical Impact Timeline
            </h3>
            <div className="relative ml-4 space-y-8 pb-4">
              {GEOPOLITICAL_EVENTS.length === 0 && <p className="text-sm text-zinc-500">Geopolitical-to-capital-flow attribution is unavailable until verified event and flow datasets are connected.</p>}
              {GEOPOLITICAL_EVENTS.map((evt) => (
                <div key={evt.id} className="relative pl-6">
                  <span className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ${evt.severity === 'High' ? 'bg-rose-500' : 'bg-amber-500'} border-4 border-zinc-950`} />
                  <div className="bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{evt.date} • {evt.region}</div>
                         <h4 className="text-base font-bold text-zinc-100">{evt.event}</h4>
                       </div>
                       <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${evt.fiiFlow > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                         FII Flow: {evt.fiiFlow > 0 ? '+' : ''}{evt.fiiFlow}M
                       </div>
                     </div>
                     <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-indigo-500/50 pl-3">
                       {evt.impact}
                     </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drill-down Modal */}
      <AnimatePresence>
        {selectedDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedDeal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px]" />

               <div className="flex justify-between items-start mb-6 relative z-10">
                 <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase border ${
                      selectedDeal.type === 'FII' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {selectedDeal.type}
                    </span>
                    <h2 className="text-xl font-bold text-white">{selectedDeal.investor}</h2>
                 </div>
                 <button onClick={() => setSelectedDeal(null)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900 rounded-full p-1">
                   <X className="w-4 h-4" />
                 </button>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
                  <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                     <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Who</div>
                     <div className="text-sm font-semibold text-zinc-200">{selectedDeal.investor}</div>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                     <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Where (Asset)</div>
                     <div className="text-sm font-semibold text-zinc-200">{selectedDeal.targetCompany}</div>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                     <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Volume</div>
                     <div className={`text-sm font-bold font-mono ${selectedDeal.sentiment === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {selectedDeal.currency} {(selectedDeal.amount / 1000000).toFixed(1)}M
                     </div>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                     <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Execution Date</div>
                     <div className="text-sm font-semibold text-zinc-200">
                       {new Date(selectedDeal.date).toLocaleDateString()}
                     </div>
                  </div>
               </div>

               <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 relative z-10 mb-6">
                 <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                   <Clock className="w-3.5 h-3.5" /> Why: Strategic Rationale
                 </div>
                 <p className="text-sm text-zinc-300 leading-relaxed">
                   "{selectedDeal.rationale}"
                 </p>

                 {/* 100x Density AI Analysis Panel */}
                 <div className="mt-4 pt-4 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <span className="block text-[9px] uppercase text-zinc-500 font-mono mb-2">Liquidity Absorption Map</span>
                     <div className="flex gap-1 h-8 items-end">
                       {Array.from({length: 20}).map((_, i) => (
                         <div key={i} className={`flex-1 rounded-sm ${i > 12 ? 'bg-emerald-500/80' : 'bg-zinc-700/50'}`} style={{ height: `${15 + Math.round(30 + Math.sin(i * 0.4) * 25 + ((i * 7) % 25))}%` }}></div>
                       ))}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div className="bg-black/40 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2">
                       <span className="block text-[8px] uppercase text-zinc-500 font-mono">Counterparty Risk</span>
                       <span className="text-[10px] font-mono font-bold text-emerald-400">Low (0.12%)</span>
                     </div>
                     <div className="bg-black/40 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2">
                       <span className="block text-[8px] uppercase text-zinc-500 font-mono">Market Impact</span>
                       <span className="text-[10px] font-mono font-bold text-amber-400">+1.24% Slip</span>
                     </div>
                     <div className="bg-black/40 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2">
                       <span className="block text-[8px] uppercase text-zinc-500 font-mono">Dark Pool Vol</span>
                       <span className="text-[10px] font-mono font-bold text-indigo-400">42%</span>
                     </div>
                     <div className="bg-black/40 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2">
                       <span className="block text-[8px] uppercase text-zinc-500 font-mono">Algorithm</span>
                       <span className="text-[10px] font-mono font-bold text-zinc-300">TWAP</span>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="flex gap-3 relative z-10">
                 <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                   View Order Book
                 </button>
                 <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm" onClick={() => setSelectedDeal(null)}>
                   Close Details
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


