import React from 'react';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

class PaymentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error for debugging
    if (import.meta.env.DEV) {
      console.error('Payment functionality error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className="mb-4">
            <Icons.CreditCard className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Payment System Error
            </h2>
            <p className="text-gray-600 mb-6">
              We're experiencing technical difficulties with our payment system. 
              Please try again later or contact support if the issue persists.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              icon={Icons.RefreshCw}
            >
              Refresh Page
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
              icon={Icons.Home}
            >
              Return to Dashboard
            </Button>
            
            <Button
              onClick={() => window.location.href = 'mailto:support@csvdashboard.com?subject=Payment%20System%20Error'}
              variant="ghost"
              className="w-full"
              icon={Icons.Mail}
            >
              Contact Support
            </Button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details (Development Mode)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                <div className="mb-2">
                  <strong>Error:</strong> {this.state.error.toString()}
                </div>
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </Card>
      );
    }

    return this.props.children;
  }
}

export default PaymentErrorBoundary;
