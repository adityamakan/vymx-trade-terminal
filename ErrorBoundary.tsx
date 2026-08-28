import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0A0B0D] flex items-center justify-center p-6 text-zinc-300 font-sans">
          <div className="max-w-2xl w-full bg-zinc-900/50 border border-zinc-800/60 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/60 pb-4">
              <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Application Exception Caught</h1>
            </div>
            
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Vymx Terminal encountered a fatal runtime rendering error. The application has safely halted execution to prevent state corruption.
            </p>
            
            <div className="bg-[#050607] rounded-xl border border-zinc-800/60 p-4 mb-6 overflow-auto max-h-[300px] custom-scrollbar">
              <pre className="text-[11px] font-mono leading-relaxed text-rose-400/80 whitespace-pre-wrap break-words">
                {this.state.error && this.state.error.toString()}
                {'\n'}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors"
              >
                <RefreshCw size={14} />
                Reboot Application Core
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
