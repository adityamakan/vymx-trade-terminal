const fs = require('fs');

const componentCode = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Globe, ShieldAlert, Newspaper, Activity, RefreshCw, ChevronDown, ChevronUp, MapPin, Clock, HelpCircle, Target, DollarSign } from 'lucide-react';

interface GeopoliticsProps {
  isMobile: boolean;
}

export const Geopolitics: React.FC<GeopoliticsProps> = ({ isMobile }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTension, setExpandedTension] = useState<string | null>(null);

  const fetchGeopolitics = async (force = false) => {
    if (!data || force) setIsLoading(true);
    setError(null);
    try {
      const endpoint = force ? '/api/ai/geopolitics?forceRefresh=true' : '/api/ai/geopolitics';
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch geopolitical intelligence");
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGeopolitics();
    
    // Auto-update every 5 minutes (300000 ms) to keep the data fresh
    const intervalId = setInterval(() => {
      fetchGeopolitics(true);
    }, 300000);

    return () => clearInterval(intervalId);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedTension(prev => prev === id ? null : id);
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="h-8 w-8 text-rose-500" />
            <h1 className="text-3xl font-black text-white tracking-tight">Geopolitical Tension</h1>
          </div>
          <p className="text-zinc-400 max-w-2xl text-sm md:text-base">
            Live intelligence tracking global conflicts, political affairs, and their macroeconomic impact on sovereign and corporate risk. Automatically updates.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {data && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 flex-1 md:flex-none flex items-center justify-between gap-4">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Global Risk Index</span>
              <div className="flex items-center gap-2">
                <span className={\`text-xl font-bold \${data.globalRiskIndex > 70 ? 'text-rose-500' : data.globalRiskIndex > 40 ? 'text-amber-400' : 'text-emerald-400'}\`}>
                  {data.globalRiskIndex}
                </span>
                <span className="text-zinc-500 text-xs">/100</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => fetchGeopolitics(true)} 
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-700"
            disabled={isLoading}
            title="Force refresh data"
          >
            <RefreshCw className={\`h-5 w-5 \${isLoading ? 'animate-spin' : ''}\`} />
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-500 font-mono animate-pulse text-sm">Aggregating global intelligence...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-400" />
              Active Tension Hotspots (Detailed)
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {data.tensions.map((tension: any, index: number) => {
                const isExpanded = expandedTension === tension.id;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={tension.id}
                    className={\`bg-zinc-900/60 border \${isExpanded ? 'border-indigo-500/50' : 'border-zinc-800/80 hover:border-zinc-700'} rounded-xl transition-colors flex flex-col overflow-hidden\`}
                  >
                    {/* Header Section (Always Visible) */}
                    <div 
                      className="p-5 cursor-pointer select-none"
                      onClick={() => toggleExpand(tension.id)}
                    >
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                          {tension.region}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={\`text-xs font-bold px-2 py-1 rounded \${tension.impact === 'High' ? 'bg-rose-500/10 text-rose-400' : tension.impact === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}\`}>
                            {tension.impact} Impact
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-2 leading-tight">{tension.title}</h3>
                      {!isExpanded && (
                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                          {tension.description}
                        </p>
                      )}
                      
                      {!isExpanded && (
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-zinc-500 font-mono">Severity Level</span>
                            <span className="text-xs font-bold text-zinc-300">{tension.severity}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5">
                            <div 
                              className={\`h-1.5 rounded-full \${tension.severity > 80 ? 'bg-rose-500' : tension.severity > 50 ? 'bg-amber-400' : 'bg-emerald-400'}\`} 
                              style={{ width: \`\${Math.min(tension.severity, 100)}%\` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detailed Section (Expandable) */}
                    <AnimatePresence>
                      {isExpanded && tension.details && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-800/50 bg-zinc-900/80"
                        >
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* WHAT */}
                            <div className="flex gap-3">
                              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">What is Happening</h4>
                                <p className="text-sm text-zinc-400 leading-relaxed">{tension.details.what}</p>
                              </div>
                            </div>

                            {/* WHERE */}
                            <div className="flex gap-3">
                              <MapPin className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">Where</h4>
                                <p className="text-sm text-zinc-400 leading-relaxed">{tension.details.where}</p>
                              </div>
                            </div>

                            {/* WHEN */}
                            <div className="flex gap-3">
                              <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">When / Timeline</h4>
                                <p className="text-sm text-zinc-400 leading-relaxed">{tension.details.when}</p>
                              </div>
                            </div>

                            {/* WHY */}
                            <div className="flex gap-3">
                              <HelpCircle className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">Why (Root Causes)</h4>
                                <p className="text-sm text-zinc-400 leading-relaxed">{tension.details.why}</p>
                              </div>
                            </div>

                            {/* HOW */}
                            <div className="flex gap-3">
                              <Target className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">How (Methods)</h4>
                                <p className="text-sm text-zinc-400 leading-relaxed">{tension.details.how}</p>
                              </div>
                            </div>

                            {/* ECONOMIC IMPACT */}
                            <div className="flex gap-3 md:col-span-2 bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/10">
                              <DollarSign className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Economic & Market Impact</h4>
                                <p className="text-sm text-zinc-300 leading-relaxed">{tension.details.economic_impact}</p>
                              </div>
                            </div>

                          </div>
                          
                          {/* Expanded Footer with Severity */}
                          <div className="px-5 pb-5 pt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-zinc-500 font-mono">Severity Level</span>
                              <span className="text-xs font-bold text-zinc-300">{tension.severity}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5">
                              <div 
                                className={\`h-1.5 rounded-full \${tension.severity > 80 ? 'bg-rose-500' : tension.severity > 50 ? 'bg-amber-400' : 'bg-emerald-400'}\`} 
                                style={{ width: \`\${Math.min(tension.severity, 100)}%\` }}
                              ></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-indigo-400" />
              Geopolitical News & Affairs
            </h2>
            
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl overflow-hidden flex flex-col">
              {data.news.map((item: any, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  key={idx}
                  className="p-4 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors group cursor-default"
                >
                  <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors mb-2 leading-relaxed">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                    <Activity className="h-3 w-3" />
                    {item.time}
                  </div>
                </motion.div>
              ))}
              
              {(!data.news || data.news.length === 0) && (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  No critical affairs detected at this moment.
                </div>
              )}
            </div>
          </div>
          
        </div>
      ) : null}
    </div>
  );
};
`;

fs.writeFileSync('src/components/Geopolitics.tsx', componentCode);
console.log("Written new Geopolitics component");
