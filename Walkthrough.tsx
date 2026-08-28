import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  HelpCircle, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Play, 
  CheckCircle,
  TrendingUp,
  Sliders,
  Wallet,
  Activity,
  Star
} from 'lucide-react';

interface WalkthroughProps {
  currentView: string;
  setView: (view: 'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows') => void;
}

interface StepConfig {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  icon: React.ReactNode;
  actionRequiredView?: 'dashboard' | 'details';
  buttonLabel?: string;
}

export default function Walkthrough({ currentView, setView }: WalkthroughProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Define walkthrough tour steps
  const steps: StepConfig[] = [
    {
      id: 'welcome',
      title: 'Welcome to Vymx Trade Terminal 👋',
      description: 'Vymx Trade is an advanced live marketplace terminal equipped with premium interactive charting, full-scale simulated portfolios, and deep technical indicators. Let\'s get you acclimated in under a minute!',
      icon: <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />,
      buttonLabel: 'Begin Walkthrough'
    },
    {
      id: 'portfolio_capital',
      title: 'Virtual Sandbox Capital 💰',
      description: 'You are armed with a starting capital of $100,000 USD virtual credit. Simulate high-leverage positions and study price movements entirely stress-free!',
      targetId: 'virtual-equity-badge',
      icon: <Wallet className="h-6 w-6 text-emerald-400" />,
    },
    {
      id: 'watchlist',
      title: 'Tracked Assets & Watchlist ⭐',
      description: 'Monitor high-liquidity stocks, top cryptocurrency pairs, and major indices. Bookmark your favorite tickers anywhere to make them pop up right here.',
      targetId: 'watchlist-section',
      actionRequiredView: 'dashboard',
      icon: <Star className="h-6 w-6 text-amber-400 fill-amber-500/10" />,
    },
    {
      id: 'technical_charts',
      title: 'Fx Advanced Custom Indicators 📈',
      description: 'Click any asset to access professional interactive charting. Use the specialized "Fx Indicators" dropdown to toggle overlays (SMA, EMA, Bollinger Bands) and oscillator panels (RSI, MACD).',
      targetId: 'tradingview-chart-arena',
      actionRequiredView: 'details',
      icon: <Sliders className="h-6 w-6 text-cyan-400" />,
    },
    {
      id: 'quick_trade',
      title: 'Simulate Quick Trades ⚡',
      description: 'Need to capture a sudden breakout? Click this persistent terminal key to instantly buy or sell assets at real-time simulated prices.',
      targetId: 'quick-trade-fab',
      icon: <Activity className="h-6 w-6 text-fuchsia-400" />,
    }
  ];

  // Run on mount to check if first time
  useEffect(() => {
    const isCompleted = localStorage.getItem('finova_tour_completed_v1');
    if (!isCompleted) {
      // Small delay to let the app settle
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync views when stepping through
  const activeStepConfig = steps[currentStep];

  useEffect(() => {
    if (!isActive) return;
    
    // Auto-navigate to appropriate view for the step
    if (activeStepConfig.actionRequiredView) {
      if (currentView !== activeStepConfig.actionRequiredView) {
        setView(activeStepConfig.actionRequiredView);
        // Wait a tick for rendering transition
        setTimeout(updateSpotlightPosition, 250);
        return;
      }
    }

    updateSpotlightPosition();

    // Listen to resize to keep highlight pinpointed
    window.addEventListener('resize', updateSpotlightPosition);
    window.addEventListener('scroll', updateSpotlightPosition);

    return () => {
      window.removeEventListener('resize', updateSpotlightPosition);
      window.removeEventListener('scroll', updateSpotlightPosition);
    };
  }, [currentStep, isActive, currentView, activeStepConfig]);

  const updateSpotlightPosition = () => {
    const targetId = activeStepConfig.targetId;
    if (!targetId) {
      setTargetRect(null);
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Only set if coordinates exist and element is visible
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        // Scroll into view gently if element is out of viewport bounds
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem('finova_tour_completed_v1', 'true');
  };

  const handleResetTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  // Compute absolute layout mapping for placing the tooltip box safely relative to the spotlight element
  const tooltipStyle = useMemo(() => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = viewportWidth - targetRect.right;
    
    // Default position values
    let top = targetRect.bottom + window.scrollY + 16;
    let left = targetRect.left + window.scrollX + (targetRect.width / 2) - 160; // center tooltip horizontally

    // Keep within horizontal window boundary
    if (left < 16) left = 16;
    if (left + 340 > viewportWidth) left = viewportWidth - 364;

    // Flip position to top if not enough space below
    if (spaceBelow < 220 && spaceAbove > 220) {
      top = targetRect.top + window.scrollY - 210;
    }

    // Specially position floating action button
    if (activeStepConfig.targetId === 'quick-trade-fab') {
      top = targetRect.top + window.scrollY - 190;
      left = Math.max(16, targetRect.left + window.scrollX - 320);
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      position: 'absolute' as const,
    };
  }, [targetRect, currentStep]);

  return (
    <>
      {/* Floating Walkthrough manual entry trigger button */}
      <button
        onClick={handleResetTour}
        className="fixed bottom-6 left-6 z-40 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 p-2.5 rounded-full border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 hover:border-zinc-700 shadow-xl flex items-center gap-1.5 text-xs font-mono select-none cursor-pointer group transition-all"
        title="Interactive Platform Tour Guide"
        id="manual-tour-trigger"
      >
        <HelpCircle className="h-4 w-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden md:inline font-bold pr-1">Platform Tour</span>
      </button>

      <AnimatePresence>
        {isActive && (
          <div className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto">
            {/* Dark Mask backdrop with spot excision */}
            <div className="fixed inset-0 bg-black/75 pointer-events-auto" />

            {/* Glowing spotlight highlight border ring directly over target */}
            {targetRect && (
              <motion.div
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  top: targetRect.top + window.scrollY - 6,
                  left: targetRect.left + window.scrollX - 6,
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="absolute border-[3px] border-emerald-400 rounded-2xl shadow-[0_0_24px_rgba(16,185,129,0.4)] z-50 pointer-events-none"
              />
            )}

            {/* Dynamic context interactive dialog card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={tooltipStyle}
              className="w-[325px] sm:w-[350px] bg-zinc-950 border border-zinc-850 rounded-2xl p-5 shadow-2xl z-50 select-none text-sans text-left space-y-4"
              id="walkthrough-tooltip-card"
            >
              {/* Header icons */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                    {activeStepConfig.icon}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest leading-none block mb-0.5">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                    <h4 className="text-xs font-bold font-mono uppercase tracking-tight text-white leading-tight">
                      {activeStepConfig.title}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                  title="Skip Walkthrough"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Informational context body text */}
              <p className="text-xs text-zinc-400 font-medium leading-relaxed font-sans">
                {activeStepConfig.description}
              </p>

              {/* Special tip note for interactive view transitions */}
              {activeStepConfig.actionRequiredView && (
                <div className="bg-blue-900/10 border border-blue-500/20 text-[10px] p-2 rounded-lg text-blue-300 font-sans leading-relaxed">
                  💡 <strong>View shift:</strong> We've automatically switched views to display the <strong>{activeStepConfig.actionRequiredView === 'dashboard' ? 'Market Overview' : 'Technical Chart'}</strong> panel.
                </div>
              )}

              {/* Step indicator pills */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-xs">
                {/* Visual mini circles */}
                <div className="flex gap-1">
                  {steps.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep ? 'w-4 bg-emerald-400' : 'w-1.5 bg-zinc-800'
                      }`} 
                    />
                  ))}
                </div>

                {/* Operations triggers */}
                <div className="flex gap-1.5">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white transition flex items-center gap-0.5 text-[10px] font-bold font-mono cursor-pointer"
                    >
                      <ChevronLeft className="h-3 w-3" /> Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition flex items-center gap-1 text-[10px] font-bold font-mono cursor-pointer"
                  >
                    <span>{activeStepConfig.buttonLabel || (currentStep === steps.length - 1 ? 'Finish' : 'Next')}</span>
                    {currentStep < steps.length - 1 && <ChevronRight className="h-3 w-3" />}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
