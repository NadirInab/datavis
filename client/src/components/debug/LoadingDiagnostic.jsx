import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const LoadingDiagnostic = () => {
  const { loading, currentUser, firebaseUser, visitorSession } = useAuth();
  const [diagnostics, setDiagnostics] = useState({});
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics({
        timestamp: new Date().toLocaleTimeString(),
        loading,
        hasCurrentUser: !!currentUser,
        hasFirebaseUser: !!firebaseUser,
        hasVisitorSession: !!visitorSession,
        currentUserType: currentUser ? 'authenticated' : (visitorSession ? 'visitor' : 'none'),
        loadingDuration: loading ? 'Loading...' : 'Not loading'
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, currentUser, firebaseUser, visitorSession]);

  const forceStopLoading = () => {
    // This is a debug function - in production you wouldn't expose this
    if (window.confirm('Force stop loading? This is for debugging only.')) {
      window.location.reload();
    }
  };

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 bg-yellow-50 border-yellow-200 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-yellow-800">
            Loading Diagnostic
          </h3>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            icon={showDetails ? Icons.ChevronUp : Icons.ChevronDown}
          />
        </div>

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={loading ? 'text-red-600 font-semibold' : 'text-green-600'}>
              {loading ? 'LOADING' : 'READY'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>User Type:</span>
            <span>{diagnostics.currentUserType}</span>
          </div>

          {showDetails && (
            <>
              <hr className="my-2 border-yellow-300" />
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{diagnostics.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current User:</span>
                  <span>{diagnostics.hasCurrentUser ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Firebase User:</span>
                  <span>{diagnostics.hasFirebaseUser ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Visitor Session:</span>
                  <span>{diagnostics.hasVisitorSession ? '✓' : '✗'}</span>
                </div>
              </div>

              {loading && (
                <div className="mt-3 pt-2 border-t border-yellow-300">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={forceStopLoading}
                    className="w-full text-xs border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Force Reload (Debug)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoadingDiagnostic;
