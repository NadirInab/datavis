import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/FirebaseAuthContext";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { PublicRoute } from "../components/auth/ProtectedRoute";
import { AdminRoute } from "../components/auth/ProtectedRoute";
import LoadingScreen from "../components/ui/LoadingScreen";

// Import pages
import Dashboard from "../pages/Dashboard";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Visualize from "../pages/Visualize";
import FileUploadEnhanced from "../pages/FileUploadEnhanced";
import Files from "../pages/Files";
import Profile from "../pages/Profile";
import SubscriptionPlansPage from "../pages/SubscriptionPlansPage";
import MockPaymentPage from "../pages/MockPaymentPage";
import PaymentSuccessPage from "../pages/PaymentSuccessPage";
import VisualizationTest from "../pages/VisualizationTest";
import FingerprintDebug from "../components/debug/FingerprintDebug";
import NotFound from "../pages/NotFound";

// Import admin components
import AdminDashboard from "../pages/admin/AdminDashboard";

// Import layouts
import AppLayout from "../components/layouts/AppLayout";

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  // Show loading screen while authentication is being determined
  if (loading) {
    return <LoadingScreen message="Initializing CSV Dashboard..." showProgress={true} />;
  }

  return (
    <Routes>
      {/* Public routes - Allow visitors to access the app */}
      <Route
        path="/"
        element={
          <PublicRoute redirectIfAuthenticated={true} redirectTo="/app">
            <Navigate to="/app" replace />
          </PublicRoute>
        }
      />

      <Route
        path="/signin"
        element={
          <PublicRoute redirectIfAuthenticated={true} redirectTo="/app">
            <SignIn />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute redirectIfAuthenticated={true} redirectTo="/app">
            <SignUp />
          </PublicRoute>
        }
      />

      <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
      <Route path="/mock-payment" element={<MockPaymentPage />} />
      <Route path="/subscription/success" element={<PaymentSuccessPage />} />
      <Route path="/test/visualization" element={<VisualizationTest />} />
      <Route path="/debug/fingerprint" element={<FingerprintDebug />} />

      {/* Protected app routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="files" element={<Files />} />
        <Route path="upload" element={<FileUploadEnhanced />} />
        <Route path="visualize/:fileId" element={<Visualize />} />
        <Route path="profile" element={<Profile />} />

        {/* Admin routes */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
