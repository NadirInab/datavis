import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Eye, Zap, Star } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

/**
 * Collaboration Demo Component
 * Shows collaboration features in action for marketing/demo purposes
 */
const CollaborationDemo = () => {
  const [activeDemo, setActiveDemo] = useState('cursors');

  const demoFeatures = [
    {
      id: 'cursors',
      title: 'Live Cursors',
      description: 'See where your teammates are looking in real-time',
      icon: Eye,
      color: 'blue'
    },
    {
      id: 'annotations',
      title: 'Smart Annotations',
      description: 'Add sticky notes and comments directly on charts',
      icon: MessageSquare,
      color: 'green'
    },
    {
      id: 'follow',
      title: 'Follow Mode',
      description: 'Guide your team through data discoveries',
      icon: Users,
      color: 'purple'
    },
    {
      id: 'realtime',
      title: 'Real-time Sync',
      description: 'All changes sync instantly across all users',
      icon: Zap,
      color: 'orange'
    }
  ];

  const mockUsers = [
    { id: 1, name: 'Sarah Chen', color: '#FF6B6B', avatar: '👩‍💼' },
    { id: 2, name: 'Mike Johnson', color: '#4ECDC4', avatar: '👨‍💻' },
    { id: 3, name: 'Alex Rivera', color: '#45B7D1', avatar: '👩‍🔬' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full px-4 py-2 mb-6"
        >
          <Star className="w-5 h-5 text-primary-600" />
          <span className="text-primary-700 font-medium">New Feature</span>
        </motion.div>
        
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Real-time Collaborative Data Exploration
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Work together on data analysis like never before. See live cursors, add annotations, 
          and guide your team through insights in real-time.
        </p>
      </div>

      {/* Feature Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {demoFeatures.map((feature) => (
          <Button
            key={feature.id}
            onClick={() => setActiveDemo(feature.id)}
            variant={activeDemo === feature.id ? 'primary' : 'outline'}
            className={`flex items-center space-x-2 ${
              activeDemo === feature.id 
                ? 'bg-primary-600 text-white' 
                : 'hover:bg-gray-50'
            }`}
            icon={feature.icon}
          >
            {feature.title}
          </Button>
        ))}
      </div>

      {/* Demo Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Demo Visualization */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Interactive Demo
          </h3>
          
          <div className="relative bg-gray-50 rounded-lg p-6 h-80 overflow-hidden">
            {/* Mock Chart */}
            <div className="absolute inset-4 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <p className="text-gray-600">
                  {demoFeatures.find(f => f.id === activeDemo)?.description}
                </p>
              </div>
            </div>

            {/* Mock Cursors */}
            {activeDemo === 'cursors' && (
              <>
                {mockUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      x: 50 + index * 60,
                      y: 100 + index * 40
                    }}
                    transition={{ delay: index * 0.5, repeat: Infinity, duration: 3 }}
                    className="absolute pointer-events-none"
                  >
                    <div className="flex items-center space-x-2">
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <path
                          d="M2 2L18 8L8 12L2 18V2Z"
                          fill={user.color}
                          stroke="white"
                          strokeWidth="1"
                        />
                      </svg>
                      <div 
                        className="px-2 py-1 rounded text-white text-xs font-medium"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}

            {/* Mock Annotations */}
            {activeDemo === 'annotations' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-16 left-20"
              >
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded shadow-lg max-w-48">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-medium">Sarah Chen</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    This spike in Q3 looks interesting! 📈
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Feature Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How It Works
          </h3>
          
          <div className="space-y-6">
            {activeDemo === 'cursors' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Live Cursor Tracking</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• See exactly where your teammates are looking</li>
                  <li>• Color-coded cursors for each user</li>
                  <li>• Smooth real-time movement</li>
                  <li>• Works across all chart types</li>
                </ul>
              </div>
            )}

            {activeDemo === 'annotations' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Smart Annotations</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Double-click anywhere to add notes</li>
                  <li>• Attach comments to specific data points</li>
                  <li>• Voice comments with audio playback</li>
                  <li>• Persistent across sessions</li>
                </ul>
              </div>
            )}

            {activeDemo === 'follow' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Follow Mode</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Guide team members through insights</li>
                  <li>• Synchronized chart navigation</li>
                  <li>• Perfect for presentations</li>
                  <li>• One-click to start following</li>
                </ul>
              </div>
            )}

            {activeDemo === 'realtime' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Real-time Sync</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Instant synchronization</li>
                  <li>• Offline support with sync queue</li>
                  <li>• Conflict resolution</li>
                  <li>• WebSocket-powered performance</li>
                </ul>
              </div>
            )}

            {/* Active Users */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Active Collaborators</h4>
              <div className="space-y-2">
                {mockUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">Online now</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <Button
          variant="primary"
          size="lg"
          className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
        >
          Try Collaboration Features
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          Available for registered users • Real-time collaboration
        </p>
      </div>
    </div>
  );
};

export default CollaborationDemo;
