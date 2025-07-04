import React, { useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5A827E] to-[#84AE92] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <Icons.Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Upload Limit Reached</h3>
                <p className="text-white/80 text-sm">Sign up to continue uploading</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Status */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Files Uploaded</span>
              <span className="font-semibold text-gray-900">{filesUploaded} / {maxFiles}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#5A827E] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(filesUploaded / maxFiles) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{reason}</p>
            
            {/* Visitor ID Info */}
            {visitorId && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {fingerprintReady ? 'Visitor ID' : 'Session ID'}
                  </span>
                  {fingerprintReady && (
                    <div className="flex items-center">
                      <Icons.Shield className="w-3 h-3 text-blue-500 mr-1" />
                      <span className="text-xs text-blue-600">Persistent</span>
                    </div>
                  )}
                </div>
                <div className="text-xs font-mono text-gray-500 mt-1">
                  {formatVisitorId(visitorId)}
                </div>
                {fingerprintReady && (
                  <p className="text-xs text-blue-600 mt-1">
                    Your upload limit is tracked across browser sessions
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Sign up to unlock:</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Upload up to 5 files (vs 2 for guests)</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>10MB storage (vs 5MB for guests)</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Multiple file formats (Excel, JSON, etc.)</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Save and manage your visualizations</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Export in multiple formats</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>No more upload limits</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignup}
              variant="primary"
              className="w-full"
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
              className="w-full"
              icon={Icons.Mail}
            >
              Sign up with Email
            </Button>
            
            <div className="text-center">
              <button
                onClick={handleSignin}
                className="text-sm text-[#5A827E] hover:text-[#5A827E]/80 transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>

          {/* Privacy & Security Note */}
          <div className="mt-6 space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Icons.Shield className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Your data is secure</p>
                  <p>We use industry-standard encryption and never share your data with third parties.</p>
                </div>
              </div>
            </div>
            
            {fingerprintReady && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-start">
                  <Icons.Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium mb-1">Persistent tracking active</p>
                    <p>Your upload limits are securely tracked across browser sessions using FingerprintJS.</p>
                  </div>
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