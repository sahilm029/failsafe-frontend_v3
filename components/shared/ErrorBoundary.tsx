"use client";

import { Component, type ReactNode } from "react";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md w-full bg-card rounded-lg border border-border p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-danger/10 rounded">
                <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Something went wrong
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  {this.state.error?.message ||
                    "An unexpected error occurred. Please try again."}
                </p>
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
