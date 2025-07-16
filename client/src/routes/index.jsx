import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../context/FirebaseAuthContext";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { PublicRoute } from "../components/auth/ProtectedRoute";
import { AdminRoute } from "../components/auth/ProtectedRoute";
import LoadingScreen from "../components/ui/LoadingScreen";

// Import pages
import LandingPage from "../pages/LandingPage";
import LandingPageTest from "../pages/LandingPageTest";
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
import FileConversionHub from "../pages/FileConversionHub";
import FingerprintDebug from "../components/debug/FingerprintDebug";
import GoogleSignInTest from "../components/testing/GoogleSignInTest";
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
      {/* Public routes - Landing page for all visitors */}
      <Route
        path="/"
        element={<LandingPage />}
      />

      {/* File Conversion Hub - Public route */}
      <Route
        path="/convert"
        element={<FileConversionHub />}
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
        path="/login"
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

      <Route
        path="/register"
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
      <Route path="/test/landing" element={<LandingPageTest />} />
      <Route path="/test/google-signin" element={<GoogleSignInTest />} />
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
