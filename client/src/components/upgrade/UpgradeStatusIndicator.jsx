import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const UpgradeStatusIndicator = ({ 
  feature, 
  requiredTier = 'pro', 
  showInline = false,
  customMessage = null 
}) => {
  const navigate = useNavigate();
  const { currentUser, isVisitor } = useAuth();
  const [upgradeAvailable, setUpgradeAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if upgrade functionality is available
    checkUpgradeAvailability();
  }, []);

  const checkUpgradeAvailability = async () => {
    try {
      // Test if subscription plans page is accessible
      const response = await fetch('/subscription-plans', { method: 'HEAD' });
      setUpgradeAvailable(response.ok || response.status === 200);
    } catch (error) {
      setUpgradeAvailable(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      if (!upgradeAvailable) {
        throw new Error('Upgrade functionality is currently unavailable');
      }

      if (isVisitor()) {
        // Redirect visitors to signup with plan selection
        navigate(`/signup?plan=${requiredTier}&feature=${encodeURIComponent(feature)}`);
      } else {
        // Redirect authenticated users to subscription plans
        navigate('/subscription-plans', {
          state: {
            highlightTier: requiredTier,
            feature: feature
          }
        });
      }
    } catch (error) {
      console.error('Upgrade navigation failed:', error);
      
      // Fallback: Show coming soon message
      alert('Upgrade functionality is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTier = () => {
    if (isVisitor()) return 'visitor';
    return currentUser?.subscription || 'free';
  };

  const getTierDisplayName = (tier) => {
    const tierNames = {
      visitor: 'Visitor',
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise'
    };
    return tierNames[tier] || tier;
  };

  const getUpgradeMessage = () => {
    if (customMessage) return customMessage;
    
    const currentTier = getCurrentTier();
    const requiredTierName = getTierDisplayName(requiredTier);
    
    if (currentTier === 'visitor') {
      return `Sign up for ${requiredTierName} to access ${feature}`;
    }
    
    return `Upgrade to ${requiredTierName} to unlock ${feature}`;
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (!upgradeAvailable) return 'Coming Soon';
    
    const currentTier = getCurrentTier();
    
    if (currentTier === 'visitor') {
      return `Sign Up for ${getTierDisplayName(requiredTier)}`;
    }
    
    return `Upgrade to ${getTierDisplayName(requiredTier)}`;
  };

  const getButtonIcon = () => {
    if (loading) return Icons.Loader;
    if (!upgradeAvailable) return Icons.Clock;
    
    const currentTier = getCurrentTier();
    
    if (currentTier === 'visitor') {
      return Icons.UserPlus;
    }
    
    return Icons.ArrowUp;
  };

  if (showInline) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
        <Icons.Lock className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-blue-700">{getTierDisplayName(requiredTier)} Feature</span>
        <Button
          onClick={handleUpgrade}
          disabled={loading || !upgradeAvailable}
          size="xs"
          variant="ghost"
          className="text-blue-600 hover:text-blue-700 p-1"
          icon={getButtonIcon()}
        >
          {upgradeAvailable ? 'Upgrade' : 'Soon'}
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6 text-center border-2 border-dashed border-gray-300">
      <div className="mb-4">
        <Icons.Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {getTierDisplayName(requiredTier)} Feature
        </h3>
        <p className="text-gray-600 mb-4">
          {getUpgradeMessage()}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleUpgrade}
          disabled={loading || !upgradeAvailable}
          className="w-full"
          icon={getButtonIcon()}
        >
          {getButtonText()}
        </Button>

        {!upgradeAvailable && (
          <div className="text-sm text-gray-500">
            <p>Upgrade functionality is temporarily unavailable.</p>
            <p>Please check back later or contact support.</p>
          </div>
        )}
      </div>

      {/* Feature Benefits */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          {getTierDisplayName(requiredTier)} Benefits:
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {requiredTier === 'pro' && (
            <>
              <li>• Advanced export formats (PDF, Excel)</li>
              <li>• Priority support</li>
              <li>• Advanced visualizations</li>
              <li>• Increased file limits</li>
            </>
          )}
          {requiredTier === 'enterprise' && (
            <>
              <li>• All Pro features</li>
              <li>• Custom branding</li>
              <li>• API access</li>
              <li>• Dedicated support</li>
              <li>• Advanced analytics</li>
            </>
          )}
        </ul>
      </div>
    </Card>
  );
};

// Hook for easy upgrade prompts
export const useUpgradePrompt = () => {
  const navigate = useNavigate();
  const { currentUser, isVisitor } = useAuth();

  const showUpgradePrompt = (feature, requiredTier = 'pro') => {
    try {
      if (isVisitor()) {
        navigate(`/signup?plan=${requiredTier}&feature=${encodeURIComponent(feature)}`);
      } else {
        navigate('/subscription-plans', {
          state: {
            highlightTier: requiredTier,
            feature: feature
          }
        });
      }
    } catch (error) {
      console.error('Upgrade prompt failed:', error);
      
      // Fallback: Show alert
      const currentTier = isVisitor() ? 'visitor' : (currentUser?.subscription || 'free');
      const action = currentTier === 'visitor' ? 'Sign up' : 'Upgrade';
      
      alert(`${action} to ${requiredTier} to access ${feature}. Upgrade functionality is temporarily unavailable.`);
    }
  };

  const canAccess = (requiredTier) => {
    if (isVisitor()) return requiredTier === 'visitor' || requiredTier === 'free';
    
    const currentTier = currentUser?.subscription || 'free';
    const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
    
    return tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
  };

  return { showUpgradePrompt, canAccess };
};

export default UpgradeStatusIndicator;
