'use client';

import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: any, info: any) {
    // Log to console for now (Vercel will capture client logs)
    console.error('[ErrorBoundary]', this.props.label || 'section', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-4 border border-red-800/40 bg-red-900/10 text-red-300 text-sm">
          <div className="font-semibold mb-1">A section failed to render{this.props.label ? `: ${this.props.label}` : ''}.</div>
          <div className="opacity-80">{this.state.message}</div>
        </div>
      );
    }
    return this.props.children as any;
  }
}


