import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, AlertCircle, Settings2, Trash2, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Asset, PortfolioItem } from '../types';

interface FinancialChatbotProps {
  activeAsset?: Asset | null;
  portfolio?: PortfolioItem[];
}

const TypingMessage = ({ content, isNew }: { content: string, isNew?: boolean }) => {
  const [displayed, setDisplayed] = useState(isNew ? '' : content);
  
  useEffect(() => {
    if (!isNew) {
      setDisplayed(content);
      return;
    }
    
    let index = 0;
    const interval = setInterval(() => {
      index += 5; // Speed of typing
      if (index >= content.length) {
        setDisplayed(content);
        clearInterval(interval);
      } else {
        setDisplayed(content.substring(0, index));
      }
    }, 10);
    return () => clearInterval(interval);
  }, [content, isNew]);

  return <ReactMarkdown>{displayed}</ReactMarkdown>;
};

export default function FinancialChatbot({ activeAsset, portfolio }: FinancialChatbotProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string, isNew?: boolean }[]>(() => {
    const saved = localStorage.getItem('vymx_chatbot_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, isNew: false }));
      } catch (e) {
        // ignore
      }
    }
    return [
      { role: 'assistant', text: 'Hello! I am your advanced AI Financial Chatbot. You can ask me any question regarding finance, markets, trading strategies, or your current portfolio.', isNew: false }
    ];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState('Technical Analyst');
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
          setSpeechError(null);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          setSpeechError(event.error === 'not-allowed' ? 'Microphone access denied' : 'Speech recognition error');
          setTimeout(() => setSpeechError(null), 3000);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition not supported in this browser');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setSpeechError(null);
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('vymx_chatbot_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleClear = () => {
    setMessages([
      { role: 'assistant', text: 'Conversation history cleared. How can I help you today?', isNew: true }
    ]);
    setShowSettings(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/generic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          history: messages.slice(-10),
          persona,
          contextData: {
            activeAsset,
            portfolio
          }
        })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply, isNew: true }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error connecting to the AI. Please try again.', isNew: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-4 space-y-4 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md p-6 flex-none relative">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md border border-indigo-500/30">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Financial Chatbot</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {persona}
                </span>
                {(activeAsset || (portfolio && portfolio.length > 0)) && (
                   <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                     Context Active
                   </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-10 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-2">Advisor Persona</label>
                  <div className="flex flex-wrap gap-2">
                    {['Technical Analyst', 'Aggressive Growth', 'Conservative Wealth'].map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPersona(p); setShowSettings(false); }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          persona === p 
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleClear}
                  className="flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Chat
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md overflow-hidden flex flex-col min-h-0 relative">
        {speechError && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-rose-500/90 text-white text-xs px-3 py-1.5 rounded-full z-10 animate-fade-in shadow-lg">
            {speechError}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50'}`}>
                {msg.role === 'user' ? (
                  msg.text
                ) : (
                  <div className="markdown-body text-sm">
                    <TypingMessage content={msg.text} isNew={msg.isNew} />
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-zinc-400" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
                Thinking...
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800/60">
          <form onSubmit={handleSend} className="relative flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask anything about finance, markets, or trading..."}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-4 pr-24 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition-colors ${isListening ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 rounded-lg bg-indigo-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3" />
              AI can make mistakes. Always verify important financial information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
