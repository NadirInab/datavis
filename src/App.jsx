import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/FirebaseAuthContext';
// Change this import to match your actual routes file
import AppRoutes from './routes/index';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

