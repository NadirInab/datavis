import React from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { getUserTier } from '../../utils/featureGating';
import Button, { Icons } from '../ui/Button';

const GeospatialPremiumOverlay = ({ 
  onUpgrade,
  totalDataPoints = 0,
  limitedDataPoints = 0,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const currentTier = getUserTier(currentUser);
  const isVisitor = currentTier === 'visitor';
  const isFree = currentTier === 'free';

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade('pro');
    } else {
      window.location.href = '/pricing?feature=geospatial&tier=pro';
    }
  };

  return (
    <div className={`absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-10 ${className}`}>
      <div className="text-center p-8 max-w-md">
        {/* Premium Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-sm font-semibold mb-6">
          <Icons.Zap className="w-4 h-4 mr-2" />
          Premium Feature
        </div>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icons.MapPin className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Interactive Geospatial Maps
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          You're viewing a limited preview with {limitedDataPoints} of {totalDataPoints} data points. 
          Upgrade to unlock the full interactive experience.
        </p>

        {/* Features List */}
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Unlock with Pro:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <Icons.CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Full dataset visualization ({totalDataPoints} points)</span>
            </li>
            <li className="flex items-center">
              <Icons.CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Interactive zoom, pan, and layer controls</span>
            </li>
            <li className="flex items-center">
              <Icons.CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Smart clustering and heatmap visualizations</span>
            </li>
            <li className="flex items-center">
              <Icons.CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              <span>GPS route analysis and tracking</span>
            </li>
            <li className="flex items-center">
              <Icons.CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              <span>High-quality map exports (PNG, PDF)</span>
            </li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg p-4 text-white mb-6">
          <div className="text-lg font-bold">Pro Plan - $29/month</div>
          <div className="text-sm text-blue-100">Cancel anytime • 30-day guarantee</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
          >
            <Icons.Zap className="w-5 h-5 mr-2" />
            Upgrade to Pro
          </Button>
          
          <div className="text-xs text-gray-500">
            {isVisitor && (
              <p>
                <a href="/register" className="text-blue-600 hover:text-blue-700 underline">
                  Sign up for free
                </a> to get 25 data points instead of 10
              </p>
            )}
            {isFree && (
              <p>Continue with limited preview below</p>
            )}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center">
              <Icons.Shield className="w-4 h-4 mr-1" />
              <span>Secure</span>
            </div>
            <div className="flex items-center">
              <Icons.CheckCircle className="w-4 h-4 mr-1" />
              <span>30-day guarantee</span>
            </div>
            <div className="flex items-center">
              <Icons.Users className="w-4 h-4 mr-1" />
              <span>10,000+ users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeospatialPremiumOverlay;
