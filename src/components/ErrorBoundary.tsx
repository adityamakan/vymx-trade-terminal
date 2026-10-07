import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Terminal Boundary Caught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          background: '#0d1117',
          color: '#f85149',
          fontFamily: 'monospace',
          borderRadius: '8px',
          border: '1px solid #30363d',
          margin: '2rem'
        }}>
          <h2>⚡ Vymx-Trade Session Recovery</h2>
          <p>A non-critical rendering anomaly occurred in this panel.</p>
          <pre style={{ color: '#8b949e', fontSize: '0.85rem' }}>{this.state.errorMsg}</pre>
          <button 
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            style={{
              background: '#238636',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Reset Terminal View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}