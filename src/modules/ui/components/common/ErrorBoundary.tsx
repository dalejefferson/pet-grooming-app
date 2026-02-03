import { Component, type ReactNode } from 'react'
import { Button } from './Button'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] p-6">
          <div className="w-full max-w-md rounded-2xl border-2 border-[#1e293b] bg-white p-8 shadow-[4px_4px_0px_0px_#1e293b]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-red-50 text-2xl">
              !
            </div>
            <h2 className="text-xl font-bold text-[#1e293b]">Something went wrong</h2>
            <p className="mt-2 text-sm text-[#64748b]">
              An unexpected error occurred. Please try again or refresh the page.
            </p>
            {this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-xl border-2 border-[#1e293b] bg-gray-50 p-3 text-xs text-[#334155]">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex gap-3">
              <Button variant="primary" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
