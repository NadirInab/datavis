import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Copy, Check, Eye, Edit, Globe,
  Loader2, AlertCircle, X, Clock, Users
} from 'lucide-react';
import Button from '../ui/Button';

/**
 * Share Button Component - Temporarily Disabled
 * Showing "Coming Soon" state while collaboration features remain active
 */
const ShareButton = ({
  fileId,
  fileName,
  onShare,
  isShared = false,
  shareUrl = '',
  className = ''
}) => {
  // Temporarily disable sharing functionality
  const SHARING_DISABLED = true;

  const [showModal, setShowModal] = useState(false);
  const [accessLevel, setAccessLevel] = useState('view');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentShareUrl, setCurrentShareUrl] = useState(shareUrl);
  const [error, setError] = useState('');

  const handleCreateShare = async () => {
    setIsCreating(true);
    setError('');

    try {
      console.log('🚀 Creating share link...');
      const settings = {
        defaultAccess: accessLevel,
        allowAnonymous: true,
        requireAuth: false,
        expiresAt: null
      };

      const result = await onShare(fileId, settings);
      console.log('✅ Share result:', result);

      if (result.success && result.shareInfo) {
        setCurrentShareUrl(result.shareInfo.shareUrl);
        console.log('🔗 Share URL set:', result.shareInfo.shareUrl);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Share creation failed:', error);
      setError(error.message || 'Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      setError('Failed to copy link to clipboard');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setCopied(false);
  };

  // Handle click for disabled state
  const handleButtonClick = () => {
    if (SHARING_DISABLED) {
      setShowModal(true); // Show "Coming Soon" modal
    } else {
      setShowModal(true); // Normal functionality
    }
  };

  return (
    <>
      {/* Share Button - Disabled State */}
      <Button
        onClick={handleButtonClick}
        variant="outline"
        icon={SHARING_DISABLED ? Clock : (isShared ? Globe : Share2)}
        disabled={SHARING_DISABLED}
        className={`${className} ${
          SHARING_DISABLED
            ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed hover:bg-gray-100'
            : isShared
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-primary-600 hover:bg-primary-700'
        } shadow-sm`}
        title={SHARING_DISABLED ? 'Share feature coming soon' : undefined}
      >
        {SHARING_DISABLED ? 'Coming Soon' : (isShared ? 'Shared' : 'Share')}
      </Button>

      {/* Coming Soon Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-[#5A827E]/20 max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#5A827E]/10">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#5A827E]/10 to-[#84AE92]/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#5A827E]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#5A827E]">Share Feature</h3>
                    <p className="text-sm text-[#5A827E]/70">Coming Soon</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-[#5A827E]/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#5A827E]" />
                </button>
              </div>

              {/* Coming Soon Content */}
              <div className="p-6 space-y-6">
                {/* Coming Soon Message */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#5A827E]/10 to-[#84AE92]/10 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 text-[#5A827E]" />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-[#5A827E] mb-2">
                      Share Feature Coming Soon
                    </h4>
                    <p className="text-[#5A827E]/70 leading-relaxed">
                      We're working on an amazing file sharing experience! In the meantime,
                      you can still collaborate in real-time with your team using our
                      collaboration features.
                    </p>
                  </div>

                  <div className="bg-[#FAFFCA]/30 rounded-lg p-4 border border-[#B9D4AA]/20">
                    <div className="flex items-center space-x-2 text-[#5A827E] mb-2">
                      <Users className="w-4 h-4" />
                      <span className="font-medium text-sm">Available Now:</span>
                    </div>
                    <ul className="text-sm text-[#5A827E]/80 space-y-1 text-left">
                      <li>• Real-time collaboration</li>
                      <li>• Live cursors and annotations</li>
                      <li>• Follow mode for guided exploration</li>
                      <li>• Voice comments and notes</li>
                    </ul>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-center pt-4 border-t border-[#5A827E]/10">
                  <Button
                    onClick={closeModal}
                    variant="primary"
                    className="bg-[#5A827E] hover:bg-[#5A827E]/90 text-white"
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShareButton;
