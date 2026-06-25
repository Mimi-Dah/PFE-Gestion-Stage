import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          padding: '2rem',
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #FEE2E2',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                ⚠️
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>Une erreur est survenue</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>L&apos;application a rencontré un problème inattendu.</p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#FFF7F7',
              border: '1px solid #FEE2E2',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#DC2626',
              overflowX: 'auto',
            }}>
              <strong>{this.state.error?.name}:</strong> {this.state.error?.message}
            </div>

            {this.state.errorInfo?.componentStack && (
              <details style={{ marginBottom: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>
                  Stack trace
                </summary>
                <pre style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  fontSize: '0.7rem',
                  color: '#475569',
                  overflowX: 'auto',
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap',
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#2563EB',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
