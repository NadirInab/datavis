import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const UpgradePrompt = ({ 
  feature, 
  currentTier, 
  requiredTier, 
  tierKey,
  description,
  onClose,
  inline = false 
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/app/subscription-plans', { 
      state: { 
        highlightTier: tierKey,
        feature: feature 
      } 
    });
  };

  const tierColors = {
    pro: 'from-blue-500 to-blue-600',
    enterprise: 'from-purple-500 to-purple-600'
  };

  const tierIcons = {
    pro: Icons.Star,
    enterprise: Icons.Crown
  };

  const TierIcon = tierIcons[tierKey] || Icons.Lock;

  if (inline) {
    return (
      <div className="bg-gradient-to-r from-[#5A827E]/10 to-[#84AE92]/10 border border-[#84AE92]/30 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-[#5A827E] to-[#84AE92] rounded-lg flex items-center justify-center">
              <TierIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-[#5A827E] mb-1">
              Premium Feature: {feature}
            </h4>
            <p className="text-xs text-[#5A827E]/70 mb-3">
              {description}
            </p>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleUpgrade}
                variant="primary"
                size="sm"
                icon={Icons.ArrowUp}
              >
                Upgrade to {requiredTier}
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  icon={Icons.X}
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto bg-gradient-to-r ${tierColors[tierKey] || 'from-gray-500 to-gray-600'} rounded-2xl flex items-center justify-center mb-4`}>
              <TierIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#5A827E] mb-2">
              Premium Feature
            </h2>
            <p className="text-[#5A827E]/70 text-sm">
              Unlock {feature} with {requiredTier}
            </p>
          </div>

          {/* Feature Details */}
          <div className="bg-[#FAFFCA]/30 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-[#5A827E] mb-2">{feature}</h3>
            <p className="text-sm text-[#5A827E]/70 mb-3">{description}</p>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5A827E]/60">Current: {currentTier}</span>
              <Icons.ArrowRight className="w-4 h-4 text-[#84AE92]" />
              <span className="text-[#5A827E] font-medium">Required: {requiredTier}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-[#5A827E] mb-3">
              What you'll get with {requiredTier}:
            </h4>
            <ul className="space-y-2 text-sm text-[#5A827E]/70">
              {tierKey === 'pro' && (
                <>
                  <li className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span>Excel, JSON, XML file support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span>Advanced chart types</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span>100MB storage</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span>Advanced export options</span>
                  </li>
                </>
              )}
              {tierKey === 'enterprise' && (
                <>
                  <li className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span>All file formats including Google Sheets</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span>Unlimited storage and exports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span>AI-powered data analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span>Priority support</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={handleUpgrade}
              variant="primary"
              className="flex-1"
              icon={Icons.ArrowUp}
            >
              Upgrade Now
            </Button>
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                className="flex-1"
                icon={Icons.X}
              >
                Maybe Later
              </Button>
            )}
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-[#5A827E]/50 hover:text-[#5A827E] transition-colors"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

// Hook for showing upgrade prompts
export const useUpgradePrompt = () => {
  const [prompt, setPrompt] = React.useState(null);

  const showUpgradePrompt = (upgradeInfo) => {
    setPrompt(upgradeInfo);
  };

  const hideUpgradePrompt = () => {
    setPrompt(null);
  };

  const UpgradePromptComponent = prompt ? (
    <UpgradePrompt
      {...prompt}
      onClose={hideUpgradePrompt}
    />
  ) : null;

  return {
    showUpgradePrompt,
    hideUpgradePrompt,
    UpgradePromptComponent
  };
};

export default UpgradePrompt;
