'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-5 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <p className="font-heading font-semibold text-[var(--text-primary)] text-base mb-1">
              Something went wrong
            </p>
            <p className="text-[var(--text-muted)] text-sm max-w-sm">
              An unexpected error occurred. Your data is safe — try reloading the page.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 border border-[var(--border-ui)] hover:border-orange-500/30 text-[var(--text-secondary)] hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
