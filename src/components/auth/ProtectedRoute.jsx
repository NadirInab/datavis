import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/FirebaseAuthContext';
import { Spinner } from '../loading/LoadingSpinner';

const ProtectedRoute = ({
  children,
  requireAuth = false, // Changed default to false to allow visitors
  requireRole = null,
  fallback = '/signin',
  allowVisitors = true // New prop to allow visitor access
}) => {
  const { currentUser, loading, getUserType, isVisitor } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFFCA]/30 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-[#5A827E]/70">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !currentUser && !allowVisitors) {
    // Redirect to sign in with return path
    return (
      <Navigate
        to={fallback}
        state={{ from: location }}
        replace
      />
    );
  }

  // Allow visitors if allowVisitors is true
  if (allowVisitors && (isVisitor() || !currentUser)) {
    return children;
  }

  // Check role requirement
  if (requireRole && currentUser) {
    const userType = getUserType();
    
    // Handle array of allowed roles
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    
    if (!allowedRoles.includes(userType)) {
      // User doesn't have required role
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. 
              {requireRole === 'admin' && ' This page is restricted to administrators only.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <Navigate to="/app" replace />
            </div>
          </div>
        </div>
      );
    }
  }

  // If we get here, user has access
  return children;
};

// Higher-order component for easier usage
export const withAuth = (Component, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Specific route components for common use cases
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireRole="admin">
    {children}
  </ProtectedRoute>
);

export const UserRoute = ({ children }) => (
  <ProtectedRoute requireAuth={true} requireRole={['user', 'admin']}>
    {children}
  </ProtectedRoute>
);

export const PublicRoute = ({ children, redirectIfAuthenticated = false, redirectTo = '/app' }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (redirectIfAuthenticated && currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;

