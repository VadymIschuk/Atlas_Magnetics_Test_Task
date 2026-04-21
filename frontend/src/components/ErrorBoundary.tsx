import { Component } from 'react'

import type { ErrorBoundaryProps, ErrorBoundaryState } from '../types/components'

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error) {
    console.error('Application error boundary caught an error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <section className="panel error-boundary-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Error</p>
                <h2>Something went wrong</h2>
              </div>
            </div>
            <div className="error-banner" role="alert">
              <strong>The application hit an unexpected error.</strong>
              <span>Please refresh the page and try again.</span>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
