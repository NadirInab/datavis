import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, Eye, EyeOff,
  Volume2, Settings, X, Maximize2
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

/**
 * Collaboration Panel Component
 * Shows collaboration status and opens modal for full interface
 */
const CollaborationPanel = ({
  collaborators = [],
  isConnected = false,
  annotations = [],
  voiceComments = [],
  followMode = null,
  isFollowing = false,
  onStartFollowMode,
  onStopFollowMode,
  onToggleAnnotations,
  onToggleVoiceComments,
  showAnnotations = true,
  showVoiceComments = true
}) => {
  const [showModal, setShowModal] = useState(false);

  const totalCollaborators = collaborators.length;
  const totalAnnotations = annotations.length;
  const totalVoiceComments = voiceComments.length;

  return (
    <>
      {/* Compact Status Indicator */}
      <div className="fixed top-4 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-sm border border-[#5A827E]/20 rounded-xl shadow-lg p-3"
        >
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <Users className="w-4 h-4 text-[#5A827E]" />
              <span className="text-sm font-medium text-[#5A827E]">
                {totalCollaborators}
              </span>
            </div>

            {/* Quick Stats */}
            {(totalAnnotations > 0 || totalVoiceComments > 0) && (
              <div className="flex items-center space-x-2 text-xs text-[#5A827E]/70">
                {totalAnnotations > 0 && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{totalAnnotations}</span>
                  </div>
                )}
                {totalVoiceComments > 0 && (
                  <div className="flex items-center space-x-1">
                    <Volume2 className="w-3 h-3" />
                    <span>{totalVoiceComments}</span>
                  </div>
                )}
              </div>
            )}

            {/* Open Modal Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              className="p-1 hover:bg-[#5A827E]/10"
              title="Open collaboration panel"
            >
              <Maximize2 className="w-4 h-4 text-[#5A827E]" />
            </Button>
          </div>

          {/* Follow Mode Indicator */}
          {isFollowing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 pt-2 border-t border-[#5A827E]/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-3 h-3 text-[#84AE92]" />
                  <span className="text-xs text-[#84AE92] font-medium">Following</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStopFollowMode}
                  className="p-0.5 hover:bg-[#84AE92]/10"
                >
                  <X className="w-3 h-3 text-[#84AE92]" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Collaboration Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Team Collaboration"
        size="lg"
      >
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#5A827E]/5 to-[#84AE92]/5 rounded-xl border border-[#5A827E]/10">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${!isConnected ? 'animate-pulse' : ''}`}></div>
              <div>
                <h3 className="font-semibold text-[#5A827E]">
                  {isConnected ? 'Connected' : 'Reconnecting...'}
                </h3>
                <p className="text-sm text-[#5A827E]/70">
                  {totalCollaborators} {totalCollaborators === 1 ? 'person' : 'people'} online
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 text-[#84AE92]">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">{totalAnnotations}</span>
                <span className="text-[#5A827E]/60">notes</span>
              </div>
              <div className="flex items-center space-x-2 text-[#B9D4AA]">
                <Volume2 className="w-4 h-4" />
                <span className="font-medium">{totalVoiceComments}</span>
                <span className="text-[#5A827E]/60">voice</span>
              </div>
            </div>
          </div>

          {/* Active Collaborators */}
          <div>
            <h4 className="text-lg font-semibold text-[#5A827E] mb-4">Active Team Members</h4>

            {totalCollaborators === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#FAFFCA]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#5A827E]/50" />
                </div>
                <p className="text-[#5A827E]/70 mb-2">No other team members online</p>
                <p className="text-sm text-[#5A827E]/50">Share this dashboard to collaborate in real-time</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {collaborators.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#5A827E]/10 hover:border-[#84AE92]/30 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-[#5A827E]">
                          {user.name || 'Anonymous User'}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-[#5A827E]/60">
                          <span>Online now</span>
                          {user.isFollowing && (
                            <>
                              <span>•</span>
                              <span className="text-[#84AE92] font-medium">Following you</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {followMode === user.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onStopFollowMode}
                          className="border-[#84AE92] text-[#84AE92] hover:bg-[#84AE92] hover:text-white"
                          icon={EyeOff}
                        >
                          Stop Following
                        </Button>
                      ) : !isFollowing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStartFollowMode(user.id)}
                          className="text-[#5A827E] hover:bg-[#5A827E]/10"
                          icon={Eye}
                        >
                          Follow
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Collaboration Controls */}
          <div>
            <h4 className="text-lg font-semibold text-[#5A827E] mb-4">Collaboration Settings</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  showAnnotations
                    ? 'border-[#84AE92] bg-[#84AE92]/5'
                    : 'border-[#5A827E]/20 hover:border-[#5A827E]/40'
                }`}
                onClick={onToggleAnnotations}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      showAnnotations ? 'bg-[#84AE92] text-white' : 'bg-[#5A827E]/10 text-[#5A827E]'
                    }`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-medium text-[#5A827E]">Annotations</h5>
                      <p className="text-sm text-[#5A827E]/60">{totalAnnotations} active notes</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    showAnnotations
                      ? 'border-[#84AE92] bg-[#84AE92]'
                      : 'border-[#5A827E]/30'
                  }`}>
                    {showAnnotations && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  showVoiceComments
                    ? 'border-[#B9D4AA] bg-[#B9D4AA]/5'
                    : 'border-[#5A827E]/20 hover:border-[#5A827E]/40'
                }`}
                onClick={onToggleVoiceComments}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      showVoiceComments ? 'bg-[#B9D4AA] text-white' : 'bg-[#5A827E]/10 text-[#5A827E]'
                    }`}>
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-medium text-[#5A827E]">Voice Comments</h5>
                      <p className="text-sm text-[#5A827E]/60">{totalVoiceComments} recordings</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    showVoiceComments
                      ? 'border-[#B9D4AA] bg-[#B9D4AA]'
                      : 'border-[#5A827E]/30'
                  }`}>
                    {showVoiceComments && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Follow Mode Status */}
          {isFollowing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-gradient-to-r from-[#84AE92]/10 to-[#B9D4AA]/10 rounded-xl border border-[#84AE92]/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#84AE92] rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium text-[#5A827E]">Follow Mode Active</h5>
                    <p className="text-sm text-[#5A827E]/70">You're following another team member's view</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStopFollowMode}
                  className="border-[#84AE92] text-[#84AE92] hover:bg-[#84AE92] hover:text-white"
                >
                  Stop Following
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CollaborationPanel;
