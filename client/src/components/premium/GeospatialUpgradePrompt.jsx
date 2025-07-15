import React, { useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { getUserTier, getUpgradeSuggestion } from '../../utils/featureGating';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GeospatialUpgradePrompt = ({ 
  feature = 'geospatial_interactive',
  onUpgrade,
  onDismiss,
  className = '',
  variant = 'overlay' // 'overlay', 'inline', 'banner'
}) => {
  const { currentUser } = useAuth();
  const currentTier = getUserTier(currentUser);
  const upgradeSuggestion = getUpgradeSuggestion(currentUser, feature);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && onDismiss) {
        onDismiss();
      }
    };

    if (variant === 'overlay') {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [onDismiss, variant]);

  const premiumFeatures = [
    {
      icon: Icons.MapPin,
      title: 'Full Dataset Visualization',
      description: 'Display unlimited data points on your maps'
    },
    {
      icon: Icons.Target,
      title: 'Interactive Controls',
      description: 'Zoom, pan, and explore your data with full interactivity'
    },
    {
      icon: Icons.Grid,
      title: 'Smart Clustering',
      description: 'Automatically group nearby points for better performance'
    },
    {
      icon: Icons.Thermometer,
      title: 'Heatmap Visualizations',
      description: 'Create intensity-based heatmaps from your data'
    },
    {
      icon: Icons.Route,
      title: 'GPS Route Analysis',
      description: 'Analyze movement patterns and track routes'
    },
    {
      icon: Icons.Download,
      title: 'High-Quality Export',
      description: 'Export maps as PNG, PDF, and other formats'
    }
  ];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(upgradeSuggestion?.tierKey || 'pro');
    } else {
      // Default upgrade flow - redirect to pricing page
      window.location.href = '/pricing?feature=geospatial&tier=' + (upgradeSuggestion?.tierKey || 'pro');
    }
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Icons.MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Unlock Full Geospatial Analytics
              </h3>
              <p className="text-sm text-gray-600">
                Get interactive maps, unlimited data points, and advanced features
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="text-gray-600"
            >
              Maybe Later
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-blue-600 to-emerald-600"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Card className={`p-6 border-2 border-dashed border-blue-300 bg-blue-50 ${className}`}>
        <div className="text-center">
          <Icons.MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Premium Geospatial Features
          </h3>
          <p className="text-gray-600 mb-4">
            Upgrade to unlock interactive maps with unlimited data points and advanced analytics
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={onDismiss}>
              Continue with Preview
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-blue-600 to-emerald-600"
            >
              Upgrade to {upgradeSuggestion?.requiredTier || 'Pro'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Default overlay variant
  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 ${className}`}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget && onDismiss) {
          onDismiss();
        }
      }}
    >
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close modal"
        >
          <Icons.X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Icons.MapPin className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Unlock Advanced Geospatial Analytics
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              You're currently on the <span className="font-semibold text-blue-600">{currentTier}</span> plan.
              Upgrade to <span className="font-semibold text-emerald-600">{upgradeSuggestion?.requiredTier || 'Pro'}</span> for full access.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">{feature.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Current Limitations */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icons.AlertTriangle className="w-3 h-3 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 mb-2 text-sm">Current Plan Limitations</h4>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                    <span>Limited to {currentTier === 'visitor' ? '10' : '25'} data points</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                    <span>Static map preview only</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                    <span>No interactive controls (zoom, pan, layer switching)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                    <span>No clustering or heatmap features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                    <span>No export capabilities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-6 text-white text-center mb-6 shadow-lg">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Icons.Zap className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold">
                {upgradeSuggestion?.requiredTier || 'Pro'} Plan
              </h3>
            </div>
            <p className="text-blue-100 mb-4 text-sm">
              Get full access to geospatial analytics and all premium features
            </p>
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-2xl font-bold">
                ${upgradeSuggestion?.tierKey === 'enterprise' ? '99' : '29'}
              </span>
              <span className="text-blue-200 text-sm">/month</span>
            </div>
            <p className="text-xs text-blue-100">
              Cancel anytime • 30-day money-back guarantee
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onDismiss}
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Continue with Preview
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpgrade}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Icons.Zap className="w-4 h-4 mr-2" />
              Upgrade to {upgradeSuggestion?.requiredTier || 'Pro'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GeospatialUpgradePrompt;
