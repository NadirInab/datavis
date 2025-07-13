import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button, { Icons } from '../ui/Button';
import { useAuth } from '../../context/FirebaseAuthContext';

const SignupPrompt = ({ 
  isOpen, 
  onClose, 
  reason = "You've reached the guest upload limit",
  filesUploaded = 0,
  maxFiles = 2,
  visitorId = null,
  fingerprintReady = false
}) => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      onClose();
      // User will be redirected after successful signup
    } catch (error) {
      console.error('Google signup failed:', error);
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = () => {
    onClose();
    navigate('/signup');
  };

  const handleSignin = () => {
    onClose();
    navigate('/signin');
  };

  const formatVisitorId = (id) => {
    if (!id) return 'Unknown';
    return id.length > 12 ? `${id.substring(0, 8)}...${id.substring(id.length - 4)}` : id;
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Overlay click to close
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto rounded-3xl shadow-2xl bg-white overflow-hidden animate-fade-in-up">
        {/* Top Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#5A827E] via-[#84AE92] to-[#B9D4AA]"></div>
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white border border-gray-200 shadow-md rounded-full p-2 z-10 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5A827E] transition"
          aria-label="Close modal"
          tabIndex={0}
        >
          <Icons.X className="w-6 h-6 text-[#5A827E]" />
        </button>
        {/* Content */}
        <div className="flex flex-col items-center px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
          {/* Large Icon */}
          <div className="bg-gradient-to-br from-[#5A827E]/20 to-[#B9D4AA]/20 rounded-full p-4 mb-4 shadow-sm">
            <Icons.Upload className="w-10 h-10 sm:w-12 sm:h-12 text-[#5A827E]" />
          </div>
          {/* Title & Subtitle */}
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#5A827E] text-center mb-1 tracking-tight">Upload Limit Reached</h3>
          <p className="text-sm sm:text-base text-[#5A827E]/80 text-center mb-4">Sign up to continue uploading and unlock more features!</p>
          {/* Upload Status */}
          <div className="w-full bg-gray-100 rounded-xl p-3 mb-5 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs text-gray-500">Files Uploaded</span>
              <span className="font-semibold text-[#5A827E]">{filesUploaded} / {maxFiles}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div 
                className="bg-gradient-to-r from-[#5A827E] to-[#B9D4AA] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(filesUploaded / maxFiles) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">{reason}</p>
          </div>
          {/* Benefits List */}
          <div className="w-full mb-6">
            <h4 className="font-semibold text-[#5A827E] mb-2 text-center">Why sign up?</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-xs sm:text-sm text-gray-700"><Icons.Check className="w-4 h-4 text-green-500 mr-2" /> Upload up to 5 files (vs 2 for guests)</li>
              <li className="flex items-center text-xs sm:text-sm text-gray-700"><Icons.Check className="w-4 h-4 text-green-500 mr-2" /> 10MB storage (vs 5MB for guests)</li>
              <li className="flex items-center text-xs sm:text-sm text-gray-700"><Icons.Check className="w-4 h-4 text-green-500 mr-2" /> Multiple file formats (Excel, JSON, etc.)</li>
              <li className="flex items-center text-xs sm:text-sm text-gray-700"><Icons.Check className="w-4 h-4 text-green-500 mr-2" /> Save and manage your visualizations</li>
              <li className="flex items-center text-xs sm:text-sm text-gray-700"><Icons.Check className="w-4 h-4 text-green-500 mr-2" /> Export in multiple formats</li>
              <li className="flex items-center text-xs sm:text-sm text-gray-700"><Icons.Check className="w-4 h-4 text-green-500 mr-2" /> No more upload limits</li>
            </ul>
          </div>
          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3 mb-2">
            <Button
              onClick={handleGoogleSignup}
              variant="primary"
              className="w-full text-base py-2 rounded-xl shadow-md"
              disabled={loading}
              icon={loading ? null : Icons.Google}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing up...
                </div>
              ) : (
                'Continue with Google'
              )}
            </Button>
            <Button
              onClick={handleEmailSignup}
              variant="outline"
              className="w-full text-base py-2 rounded-xl border-[#5A827E] text-[#5A827E] shadow-sm"
              icon={Icons.Mail}
            >
              Sign up with Email
            </Button>
          </div>
          <div className="w-full text-center mb-2">
            <button
              onClick={handleSignin}
              className="text-xs sm:text-sm text-[#5A827E] hover:text-[#84AE92] font-medium transition-colors"
            >
              Already have an account? <span className="underline">Sign in</span>
            </button>
          </div>
          {/* Privacy & Security Note */}
          <div className="w-full mt-3">
            <div className="p-3 bg-blue-50 rounded-lg flex items-start">
              <Icons.Shield className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Your data is secure</p>
                <p>We use industry-standard encryption and never share your data with third parties.</p>
              </div>
            </div>
            {fingerprintReady && (
              <div className="p-3 bg-green-50 rounded-lg flex items-start mt-2">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-700">
                  <p className="font-medium mb-1">Persistent Visitor ID</p>
                  <p>Your upload limit is tracked across browser sessions.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPrompt;