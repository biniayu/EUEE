import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#fff1f2',
            color: '#881337',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: '0.875rem',
              background: '#fff',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #fecdd3',
            }}
          >
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#4c0519' }}>
            Open the browser developer console (F12) for the full stack trace.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
