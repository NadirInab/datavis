import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Copy, Check, Eye, Edit, Globe,
  Loader2, AlertCircle, X
} from 'lucide-react';
import Button from '../ui/Button';

/**
 * Simplified Share Button Component
 * Clean, fast, and user-friendly sharing interface
 */
const ShareButton = ({
  fileId,
  fileName,
  onShare,
  isShared = false,
  shareUrl = '',
  className = ''
}) => {
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

  return (
    <>
      {/* Enhanced Share Button */}
      <Button
        onClick={() => setShowModal(true)}
        variant={isShared ? 'success' : 'primary'}
        icon={isShared ? Globe : Share2}
        className={`${className} ${isShared ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-600 hover:bg-primary-700'} shadow-sm`}
      >
        {isShared ? 'Shared' : 'Share'}
      </Button>

      {/* Simplified Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Share File</h3>
                    <p className="text-sm text-gray-500">{fileName}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Main Content */}
              <div className="p-6 space-y-6">
                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {/* Share Link Display */}
                {currentShareUrl ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <Globe className="w-5 h-5" />
                      <span className="font-medium">Share link created!</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={currentShareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                          onClick={(e) => e.target.select()}
                        />
                        <Button
                          onClick={handleCopyLink}
                          variant={copied ? "success" : "primary"}
                          size="sm"
                          icon={copied ? Check : Copy}
                          className={copied ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>

                      {copied && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center text-green-600 text-sm font-medium"
                        >
                          ✓ Link copied to clipboard!
                        </motion.div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Access Level Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Who can access this file?
                      </label>
                      <div className="space-y-2">
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          accessLevel === 'view' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            name="access"
                            value="view"
                            checked={accessLevel === 'view'}
                            onChange={(e) => setAccessLevel(e.target.value)}
                            className="sr-only"
                          />
                          <Eye className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">View only</div>
                            <div className="text-sm text-gray-500">Can view data and charts</div>
                          </div>
                        </label>

                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          accessLevel === 'edit' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            name="access"
                            value="edit"
                            checked={accessLevel === 'edit'}
                            onChange={(e) => setAccessLevel(e.target.value)}
                            className="sr-only"
                          />
                          <Edit className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">Can edit</div>
                            <div className="text-sm text-gray-500">Can modify data and create charts</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Button
                  onClick={closeModal}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </Button>

                {!currentShareUrl && (
                  <Button
                    onClick={handleCreateShare}
                    variant="primary"
                    isLoading={isCreating}
                    icon={isCreating ? Loader2 : Share2}
                    disabled={isCreating}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {isCreating ? 'Creating...' : 'Create Share Link'}
                  </Button>
                )}
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
