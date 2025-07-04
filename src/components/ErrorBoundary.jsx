import React from 'react';
import { Icons } from './ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="text-center py-10">
          <div className="text-gray-500">
            <Icons.AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {this.props.title || 'Something went wrong'}
            </h3>
            <p className="text-gray-600 mb-4">
              {this.props.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show error details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            {this.props.showRetry && (
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  if (this.props.onRetry) {
                    this.props.onRetry();
                  }
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Icons.RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Functional component wrapper for easier use
export const DataPreviewErrorBoundary = ({ children }) => (
  <ErrorBoundary
    title="Data Preview Error"
    message="Unable to display the data preview. This might be due to invalid data format or structure."
    showDetails={process.env.NODE_ENV === 'development'}
    showRetry={true}
    onError={(error, errorInfo) => {
      console.error('Data Preview Error:', error);
      console.error('Error Info:', errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);

// Specific error boundary for table rendering
export const TableErrorBoundary = ({ children }) => (
  <ErrorBoundary
    title="Table Rendering Error"
    message="Unable to render the data table. Please check your data format."
    showDetails={process.env.NODE_ENV === 'development'}
    fallback={
      <div className="text-center py-10">
        <div className="text-gray-500">
          <Icons.Table className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Table Error</h3>
          <p>Unable to render the data table. The data might be corrupted or in an unsupported format.</p>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);
