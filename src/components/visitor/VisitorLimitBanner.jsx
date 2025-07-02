import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/FirebaseAuthContext';

const VisitorLimitBanner = () => {
  const { isVisitor } = useAuth();
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisitor()) {
      fetchVisitorInfo();
    } else {
      setLoading(false);
    }
  }, [isVisitor]);

  const fetchVisitorInfo = async () => {
    try {
      let sessionId = localStorage.getItem('sessionId') ||
                     document.cookie.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1];

      // Generate a session ID if none exists
      if (!sessionId) {
        sessionId = 'visitor-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
      }

      const response = await fetch('/api/v1/auth/visitor', {
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setVisitorInfo(data.data);
      } else {
        console.error('Visitor API returned error:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch visitor info:', error);
      // Set default visitor info if API fails
      setVisitorInfo({
        sessionId: localStorage.getItem('sessionId') || 'offline-session',
        filesUploaded: 0,
        fileLimit: 3,
        remainingFiles: 3
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show banner for authenticated users
  if (!isVisitor() || loading) {
    return null;
  }

  const remainingFiles = visitorInfo?.remainingFiles ?? 3;
  const filesUploaded = visitorInfo?.filesUploaded ?? 0;
  const fileLimit = visitorInfo?.fileLimit ?? 3;

  const getProgressColor = () => {
    const percentage = (filesUploaded / fileLimit) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-[#84AE92]';
  };

  const getTextColor = () => {
    if (remainingFiles === 0) return 'text-red-700';
    if (remainingFiles === 1) return 'text-yellow-700';
    return 'text-[#5A827E]';
  };

  const getBgColor = () => {
    if (remainingFiles === 0) return 'bg-red-50 border-red-200';
    if (remainingFiles === 1) return 'bg-yellow-50 border-yellow-200';
    return 'bg-[#B9D4AA]/20 border-[#84AE92]/30';
  };

  return (
    <div className={`rounded-xl p-4 border ${getBgColor()} mb-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-[#5A827E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-semibold ${getTextColor()}`}>
                {remainingFiles > 0 ? 'Visitor Access' : 'Upload Limit Reached'}
              </h3>
              <p className={`text-sm ${getTextColor()}/80`}>
                {remainingFiles > 0 
                  ? `You have ${remainingFiles} file upload${remainingFiles !== 1 ? 's' : ''} remaining`
                  : 'Sign up for unlimited file uploads and advanced features'
                }
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-[#5A827E]/70 mb-1">
              <span>Files uploaded</span>
              <span>{filesUploaded} / {fileLimit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min((filesUploaded / fileLimit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {remainingFiles > 0 ? (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 bg-[#5A827E] text-white text-sm font-medium rounded-lg hover:bg-[#5A827E]/90 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade for Unlimited Access
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center px-4 py-2 border border-[#84AE92] text-[#5A827E] text-sm font-medium rounded-lg hover:bg-[#B9D4AA]/20 transition-colors"
                >
                  Already have an account? Sign In
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 bg-[#5A827E] text-white text-sm font-medium rounded-lg hover:bg-[#5A827E]/90 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Free Account
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center px-4 py-2 border border-[#84AE92] text-[#5A827E] text-sm font-medium rounded-lg hover:bg-[#B9D4AA]/20 transition-colors"
                >
                  Sign In to Continue
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Close button for when user wants to dismiss */}
        <button
          onClick={() => setVisitorInfo(null)}
          className="ml-4 text-[#5A827E]/50 hover:text-[#5A827E] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Benefits List */}
      {remainingFiles <= 1 && (
        <div className="mt-4 pt-4 border-t border-[#84AE92]/20">
          <p className="text-sm font-medium text-[#5A827E] mb-2">Unlock with a free account:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#5A827E]/80">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Unlimited file uploads</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Save your visualizations</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Advanced chart types</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Export & sharing features</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorLimitBanner;
