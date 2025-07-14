import React from 'react';
import { Icons } from './Button';

const LoadingScreen = ({ message = "Loading...", showProgress = false }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center">
        {/* Logo or App Name */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV Dashboard</h1>
          <p className="text-gray-600">Data Visualization Made Simple</p>
        </div>

        {/* Loading Spinner */}
        <div className="mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icons.BarChart className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Loading Message */}
        <div className="mb-4">
          <p className="text-lg text-gray-700 font-medium">{message}</p>
        </div>

        {/* Progress Bar (optional) */}
        {showProgress && (
          <div className="w-64 mx-auto mb-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {/* Loading Steps */}
        <div className="text-sm text-gray-500 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <Icons.CheckCircle className="w-4 h-4 text-green-500" />
            <span>Initializing application</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Setting up authentication</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Icons.Clock className="w-4 h-4 text-gray-400" />
            <span>Loading dashboard</span>
          </div>
        </div>

        {/* Timeout Message */}
        <div className="mt-8 text-xs text-gray-400">
          <p>Taking longer than expected?</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:text-blue-700 underline mt-1"
          >
            Try refreshing the page
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
