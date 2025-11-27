import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ZapIcon } from './Icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-focus-base flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-red-500 flex items-center justify-center text-white">
                <ZapIcon className="w-7 h-7" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold tracking-tighter text-white block leading-none">LUMINA</span>
                <span className="text-[10px] tracking-[0.25em] text-red-500 font-mono">SYSTEM ERROR</span>
              </div>
            </div>

            {/* Error message */}
            <div className="bg-red-950/30 border border-red-900 rounded-lg p-6 mb-6">
              <div className="text-red-400 font-mono text-sm mb-2">
                <span className="font-bold">[CRITICAL ERROR]</span>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Something went wrong. The application encountered an unexpected error.
              </p>
              {this.state.error && (
                <details className="text-left">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                    Technical details
                  </summary>
                  <pre className="mt-2 text-xs text-red-400/70 overflow-auto max-h-32 p-2 bg-black/30 rounded">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors uppercase tracking-wider text-sm"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 font-bold rounded-lg transition-colors uppercase tracking-wider text-sm"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Smaller error fallback for sections
export const SectionErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="text-center py-12">
    <div className="text-4xl mb-4">⚠️</div>
    <p className="text-red-400 font-mono text-sm mb-4">
      <span className="font-bold">[ERROR]</span> Failed to load this section
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-mono rounded hover:bg-red-500/10 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

