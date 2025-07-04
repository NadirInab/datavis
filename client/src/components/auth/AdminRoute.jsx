import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/FirebaseAuthContext';

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect to login page but save the attempted URL
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin()) {
    // Redirect to dashboard if user is logged in but not an admin
    return <Navigate to="/app" replace />;
  }

  return children;
};

export default AdminRoute;