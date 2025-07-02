import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { PublicRoute } from '../components/auth/ProtectedRoute';
import { AdminRoute } from '../components/auth/ProtectedRoute';

// Import pages
import Dashboard from '../pages/Dashboard';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import Visualize from '../pages/Visualize';
import FileUpload from '../pages/FileUpload';
import Files from '../pages/Files';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

// Import admin components
import AdminDashboard from '../pages/admin/AdminDashboard';

// Import layouts
import AppLayout from '../components/layouts/AppLayout';

const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public routes - Allow visitors to access the app */}
      <Route path="/" element={
        <PublicRoute redirectIfAuthenticated={true} redirectTo="/app">
          <Navigate to="/app" replace />
        </PublicRoute>
      } />
      
      <Route path="/signin" element={
        <PublicRoute redirectIfAuthenticated={true} redirectTo="/app">
          <SignIn />
        </PublicRoute>
      } />
      
      <Route path="/signup" element={
        <PublicRoute redirectIfAuthenticated={true} redirectTo="/app">
          <SignUp />
        </PublicRoute>
      } />

      {/* Protected app routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="files" element={<Files />} />
        <Route path="upload" element={<FileUpload />} />
        <Route path="visualize/:fileId" element={<Visualize />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Admin routes */}
        <Route path="admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
