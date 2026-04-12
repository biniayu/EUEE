import { Component } from 'react';
import { btnPrimary, btnSecondary } from './components/ui/designTokens.js';

/**
 * Phase 14: Global error boundary — user-friendly copy, optional dev details, recovery actions.
 * Unit tests: mount a child that throws after click; expect fallback UI and reset behavior.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 text-neutral-900">
          <div
            role="alert"
            className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 shadow-xl"
          >
            <h1 className="text-xl font-bold text-deep-blue">We hit a snag</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Something unexpected happened in the app. Your work on the server is usually safe — try reloading
              this page or going back to the dashboard.
            </p>
            {isDev && (
              <details className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-left">
                <summary className="cursor-pointer text-xs font-semibold text-neutral-600">Developer details</summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-red-900">
                  {this.state.error?.message || String(this.state.error)}
                </pre>
              </details>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className={btnPrimary} onClick={() => window.location.reload()}>
                Reload page
              </button>
              <button type="button" className={btnSecondary} onClick={this.handleReset}>
                Try again
              </button>
              <a href="/dashboard" className={`${btnSecondary} no-underline`}>
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
