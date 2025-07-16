import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, Mic, MicOff, Eye, EyeOff, 
  UserPlus, Volume2, VolumeX, Settings, X 
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

/**
 * Collaboration Panel Component
 * Shows active collaborators and collaboration controls
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const totalCollaborators = collaborators.length;
  const totalAnnotations = annotations.length;
  const totalVoiceComments = voiceComments.length;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="bg-white/95 backdrop-blur-sm border border-primary-200 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <Users className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">
              Collaboration ({totalCollaborators})
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="p-1"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Connection Status */}
              {!isConnected && (
                <div className="p-3 bg-red-50 border-b border-red-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-700">Reconnecting...</span>
                  </div>
                </div>
              )}

              {/* Collaborators List */}
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Active Users
                </h4>
                
                {totalCollaborators === 0 ? (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No other users online</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collaborators.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {user.name || 'Anonymous'}
                            </p>
                            {user.isFollowing && (
                              <p className="text-xs text-blue-600">Following you</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {followMode === user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={onStopFollowMode}
                              className="p-1 text-blue-600"
                              title="Stop following"
                            >
                              <EyeOff className="w-3 h-3" />
                            </Button>
                          )}
                          {followMode !== user.id && !isFollowing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onStartFollowMode(user.id)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Follow this user"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Collaboration Stats */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleAnnotations}
                    className={`flex items-center justify-center space-x-1 p-2 rounded-lg ${
                      showAnnotations ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-xs">{totalAnnotations}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleVoiceComments}
                    className={`flex items-center justify-center space-x-1 p-2 rounded-lg ${
                      showVoiceComments ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    <Volume2 className="w-3 h-3" />
                    <span className="text-xs">{totalVoiceComments}</span>
                  </Button>
                </div>
              </div>

              {/* Follow Mode Status */}
              {isFollowing && (
                <div className="p-3 bg-blue-50 border-t border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">Following mode active</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onStopFollowMode}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100 p-4 space-y-3"
            >
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Collaboration Settings
              </h4>
              
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Show annotations</span>
                  <input
                    type="checkbox"
                    checked={showAnnotations}
                    onChange={onToggleAnnotations}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Show voice comments</span>
                  <input
                    type="checkbox"
                    checked={showVoiceComments}
                    onChange={onToggleVoiceComments}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default CollaborationPanel;
