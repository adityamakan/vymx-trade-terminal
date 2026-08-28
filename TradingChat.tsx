import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  ShieldAlert,
  Loader2,
  Lock,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { Asset } from '../types';

interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  badge?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  message: string;
  timestamp: string;
  channel: string;
  isAi?: boolean;
}

interface TradingChatProps {
  activeAsset: Asset | null;
  currencyMode: 'AUTO' | 'USD' | 'INR';
  formatCurrency: (val: number, type: string, country?: string) => string;
}

const SIMULATED_TRADERS = [
  { username: 'NiftyScalper', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=60', badge: 'PRO', sentiment: 'bullish' as const },
  { username: 'MumbTrader99', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=60', badge: 'MEMBER', sentiment: 'neutral' as const },
  { username: 'BullRunRider', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&fit=crop&q=60', badge: 'MARKET WHALE', sentiment: 'bullish' as const },
  { username: 'HedgeMaster_IN', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&fit=crop&q=60', badge: 'PRO OPTION', sentiment: 'bearish' as const },
  { username: 'CryptoGuru_Nifty', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=60', badge: 'MOD', sentiment: 'bullish' as const },
  { username: 'OptionSeller_Delhi', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=60', badge: 'ARBITRAGE', sentiment: 'bearish' as const }
];

const CHANNELS = [
  { id: 'general', name: 'Global Lounge', desc: 'General market discussions' },
  { id: 'stocks', name: 'Indian Equities (NSE/BSE)', desc: 'Reliance, TCS, HDFC & Nifty' },
  { id: 'crypto', name: 'Crypto Room', desc: 'BTC, ETH, Altcoins trends' },
  { id: 'forex', name: 'Commodity & FX', desc: 'Gold, Crude oil & USD/INR' }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    username: 'NiftyScalper',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=60',
    badge: 'PRO',
    sentiment: 'bullish',
    message: 'Nifty index finding massive bidding interest at 50-EMA. RELIANCE holding 2950 levels keeps the trend super dominant.',
    timestamp: '05:10 AM',
    channel: 'stocks'
  },
  {
    id: 'm2',
    username: 'HedgeMaster_IN',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&fit=crop&q=60',
    badge: 'PRO OPTION',
    sentiment: 'bearish',
    message: 'Watch out for USD/INR breakout above 83.80, if that squeezes, IT stocks will fly but financial margins might see pressure!',
    timestamp: '05:11 AM',
    channel: 'forex'
  },
  {
    id: 'm3',
    username: 'BullRunRider',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&fit=crop&q=60',
    badge: 'MARKET WHALE',
    sentiment: 'bullish',
    message: 'Bitcoin consolidation look extremely identical to the macro consolidation before the grand breakout. Target remains $82k. Long and holding.',
    timestamp: '05:12 AM',
    channel: 'crypto'
  },
  {
    id: 'm4',
    username: 'MumbTrader99',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=60',
    message: 'Is Tata Consultancy Services (TCS) a buy here at these multiples with results around the corner? Comment down below.',
    timestamp: '05:13 AM',
    channel: 'stocks'
  }
];

export default function TradingChat({ activeAsset, currencyMode, formatCurrency }: TradingChatProps) {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  // Periodic simulated live messages to make chat active and dynamic
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random trader
      const trader = SIMULATED_TRADERS[Math.floor(0 * SIMULATED_TRADERS.length)];
      // Pick a random channel
      const channels = ['general', 'stocks', 'crypto', 'forex'];
      const targetChan = channels[Math.floor(0 * channels.length)];
      
      const assetTicker = activeAsset ? activeAsset.symbol : 'NIFTY50';
      const phrases = [
        `Highly monitoring ${assetTicker} order sweep profiles on the 5-minute chart right now.`,
        `The buy block orders incoming for ${assetTicker} are showing heavy institutional interest.`,
        `Volume spike on ${assetTicker}! High probability of a breakout squeeze above today's point of control.`,
        `RSI diverging on the 1-hour time frame. Expect intermediate-term consolidation before next volatility expansion.`,
        `Are we buying the breakout or waiting for the backtest of key support blocks?`,
        `Rupee fluctuations turning key forex pairs highly volatile. Staying defensive with gold and blue chips.`
      ];
      
      const textMessage = phrases[Math.floor(0 * phrases.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        username: trader.username,
        avatar: trader.avatar,
        badge: trader.badge,
        sentiment: trader.sentiment,
        message: textMessage,
        timestamp: timeStr,
        channel: targetChan
      };

      setMessages((prev) => [...prev, newMsg]);
    }, 14000); // add one every 14 seconds to feel natural without cluttering

    return () => clearInterval(interval);
  }, [activeAsset]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText('');
    setIsSending(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Append User Message
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      username: 'Aditya (You)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=60',
      badge: 'STATION LEADER',
      sentiment: 'bullish',
      message: userText,
      timestamp: timeStr,
      channel: activeChannel
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      // Stream server-side AI chatbot response
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          activeAsset,
        })
      });

      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        username: 'Vymx AI Guru',
        avatar: '/logo-ai.png',
        badge: 'CERTIFIED STRATEGIST',
        sentiment: 'neutral',
        message: data.reply,
        timestamp: timeStr,
        channel: activeChannel,
        isAi: true
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Failed to get chat response:', err);
      const errorMsg: ChatMessage = { id: Date.now().toString(), message: "I apologize, but I am currently experiencing connection issues. Please check your network or try again later.", username: 'Vymx AI', avatar: 'https://ui-avatars.com/api/?name=AI&background=6366f1&color=fff', timestamp: new Date().toISOString(), channel: 'general', isAi: true, badge: 'System' };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Filter messages for current channel
  const filteredMessages = messages.filter((m) => m.channel === activeChannel || m.channel === 'general');

  return (
    <div className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-2xl relative" id="tradingview-comm-chat">
      
      {/* Visual Header */}
      <div className="border-b border-zinc-900 bg-zinc-900/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">TradingView Live Community Chat</h2>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-500">Discuss active setups & trade alerts with real-time AI strategist insights.</p>
          </div>
        </div>
        
        {/* Active Traders stats */}
        <div className="flex items-center gap-1.5 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-850 text-[10px] text-zinc-400 font-mono">
          <Users className="h-3.5 w-3.5 text-zinc-500" />
          <span>4,192 traders online</span>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side Channels Select */}
        <div className="w-40 sm:w-56 border-r border-zinc-900 bg-zinc-950 hidden sm:flex flex-col py-3">
          <span className="text-[10px] text-zinc-500 font-black font-mono tracking-widest uppercase px-4 mb-2 block">
            CHANNELS
          </span>
          <div className="space-y-1 px-2 flex-1 overflow-y-auto">
            {CHANNELS.map((chan) => (
              <button
                key={chan.id}
                onClick={() => setActiveChannel(chan.id)}
                className={`w-full text-left rounded-lg p-2 transition-all block ${
                  activeChannel === chan.id
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-zinc-400 border border-transparent hover:text-zinc-250 hover:bg-zinc-900/40'
                }`}
              >
                <div className="text-[11px] font-bold truncate">#{chan.name}</div>
                <div className="text-[9px] text-zinc-500 truncate mt-0.5">{chan.desc}</div>
              </button>
            ))}
          </div>
          
          <div className="px-4 pt-3 border-t border-zinc-900 text-[10px] text-zinc-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>AI responses enabled</span>
          </div>
        </div>

        {/* Right Chat window */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          
          {/* Mobile Channel Picker */}
          <div className="sm:hidden border-b border-zinc-900 p-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none bg-zinc-900/20">
            {CHANNELS.map((chan) => (
              <button
                key={chan.id}
                onClick={() => setActiveChannel(chan.id)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold whitespace-nowrap transition-all border ${
                  activeChannel === chan.id
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300'
                }`}
              >
                #{chan.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Messages stream timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 items-start ${
                  msg.isAi ? 'bg-indigo-950/20 border border-indigo-950/50 p-3 rounded-2xl' : ''
                }`}
              >
                {msg.isAi ? (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center border border-indigo-400 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20">
                    V
                  </div>
                ) : (
                  <img 
                    src={msg.avatar} 
                    alt={msg.username} 
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 object-cover" 
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-black text-zinc-200">{msg.username}</span>
                    
                    {msg.badge && (
                      <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded ${
                        msg.isAi 
                          ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/15'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300'
                      }`}>
                        {msg.badge}
                      </span>
                    )}

                    {msg.sentiment && (
                      <span className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded font-mono ${
                        msg.sentiment === 'bullish' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : msg.sentiment === 'bearish'
                          ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                          : 'bg-zinc-900 text-zinc-400'
                      }`}>
                        {msg.sentiment === 'bullish' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                        {msg.sentiment}
                      </span>
                    )}

                    <span className="text-[9px] text-zinc-600 font-mono ml-auto">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
            
            {isSending && (
              <div className="flex gap-3 items-center bg-indigo-950/10 border border-indigo-950/45 p-3 rounded-2xl text-xs text-indigo-400 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Vymx AI Guru is building quant analysis for active discussion channel...</span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Interactive Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-zinc-900 bg-zinc-950 p-3 sm:p-4 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isSending ? "Guru is drafting response..." : `Discuss ${activeAsset?.symbol || 'NSE/BSE setup'}... (Type message here)`}
              disabled={isSending}
              className="flex-1 bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-xs px-3 py-2.5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-indigo-500/20 font-sans"
            >
              <span>Speak</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
