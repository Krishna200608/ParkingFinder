import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Button from "./ui/Button";

/**
 * Enterprise React Error Boundary.
 * Catches unhandled runtime rendering errors in downstream component trees
 * and displays an accessible recovery interface rather than crashing the SPA.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[React ErrorBoundary caught error]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#F8FAFC]">
          <div className="max-w-md w-full bg-white border border-[#DDE3EA] rounded-xl p-6 text-center shadow-xs">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-base font-semibold text-[#0F172A] mb-1.5">
              Something unexpected happened
            </h2>
            <p className="text-xs text-[#475569] mb-5 leading-relaxed">
              We encountered an unexpected error while rendering this view. Your session and data remain safe.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 text-left p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-red-700 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="flex items-center gap-1.5 text-xs"
              >
                <RefreshCw size={13} />
                Try Again
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = "/")}
                className="flex items-center gap-1.5 text-xs"
              >
                <Home size={13} />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

