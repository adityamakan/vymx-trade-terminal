import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] p-6 text-center border-2 border-dashed border-red-900/30 bg-red-950/10 rounded-xl my-8">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">Application Render Error</h2>
          <p className="text-slate-400 max-w-md mb-6">{this.state.error?.message || 'An unexpected error occurred while rendering the data UI.'}</p>
          <button 
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
