import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/FirebaseAuthContext';
// Change this import to match your actual routes file
import AppRoutes from './routes/index';
import LoadingDiagnostic from './components/debug/LoadingDiagnostic';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <LoadingDiagnostic />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;

