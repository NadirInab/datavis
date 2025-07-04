import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';
import paymentService, { SUBSCRIPTION_PLANS } from '../../services/paymentService';

const SubscriptionPlans = ({ onPlanSelect, currentPlan = 'free', showCurrentPlan = true }) => {
  const { currentUser, isVisitor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = paymentService.getPlanComparison(currentPlan);

  const handlePlanSelect = async (planId) => {
    if (loading) return;
    
    setLoading(true);
    setSelectedPlan(planId);

    try {
      if (onPlanSelect) {
        await onPlanSelect(planId);
      } else {
        // Default behavior - redirect to checkout
        await handleUpgrade(planId);
      }
    } catch (error) {
      console.error('Plan selection failed:', error);
      alert('Failed to process plan selection. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      if (isVisitor()) {
        // For visitors, redirect to signup with plan selection
        window.location.href = `/signup?plan=${planId}`;
        return;
      }

      // For authenticated users, redirect to mock payment page
      window.location.href = `/mock-payment?plan=${planId}&cycle=monthly`;
    } catch (error) {
      throw error;
    }
  };

  const getPlanButtonText = (plan) => {
    if (plan.isCurrent && showCurrentPlan) return 'Current Plan';
    if (plan.id === 'free') return 'Get Started Free';
    if (isVisitor()) return 'Sign Up & Upgrade';
    if (plan.isUpgrade) return `Upgrade to ${plan.name}`;
    if (plan.isDowngrade) return `Downgrade to ${plan.name}`;
    return `Switch to ${plan.name}`;
  };

  const getPlanButtonVariant = (plan) => {
    if (plan.isCurrent && showCurrentPlan) return 'ghost';
    if (plan.id === 'pro') return 'primary';
    return 'outline';
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative p-6 ${
            plan.id === 'pro' 
              ? 'border-[#5A827E] border-2 bg-gradient-to-b from-[#FAFFCA]/20 to-white' 
              : plan.isCurrent && showCurrentPlan
                ? 'border-[#84AE92] bg-[#FAFFCA]/10'
                : 'border-gray-200'
          }`}
        >
          {/* Popular Badge */}
          {plan.id === 'pro' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#5A827E] text-white px-4 py-1 rounded-full text-xs font-medium">
                Most Popular
              </span>
            </div>
          )}

          {/* Current Plan Badge */}
          {plan.isCurrent && showCurrentPlan && (
            <div className="absolute -top-3 right-4">
              <span className="bg-[#84AE92] text-white px-3 py-1 rounded-full text-xs font-medium">
                Current
              </span>
            </div>
          )}

          <div className="text-center">
            {/* Plan Name */}
            <h3 className="text-xl font-semibold text-[#5A827E] mb-2">
              {plan.name}
            </h3>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-[#5A827E]">
                {formatPrice(plan.price)}
              </span>
              {plan.price > 0 && (
                <span className="text-[#5A827E]/70 ml-1">
                  /{plan.interval}
                </span>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 text-left">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <Icons.Check className="w-5 h-5 text-[#84AE92] mt-0.5 flex-shrink-0" />
                  <span className="text-[#5A827E] text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <Button
              variant={getPlanButtonVariant(plan)}
              size="lg"
              className="w-full"
              onClick={() => handlePlanSelect(plan.id)}
              disabled={loading || (plan.isCurrent && showCurrentPlan)}
              icon={loading && selectedPlan === plan.id ? Icons.RefreshCw : undefined}
            >
              {loading && selectedPlan === plan.id ? (
                <span className="flex items-center">
                  <Icons.RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </span>
              ) : (
                getPlanButtonText(plan)
              )}
            </Button>

            {/* Additional Info */}
            {plan.id === 'free' && (
              <p className="text-xs text-[#5A827E]/70 mt-3">
                No credit card required
              </p>
            )}

            {plan.price > 0 && (
              <p className="text-xs text-[#5A827E]/70 mt-3">
                Cancel anytime • 30-day money-back guarantee
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

// Visitor-specific upgrade prompt component
export const VisitorUpgradePrompt = ({ onClose, targetFeature }) => {
  const { visitorSession } = useAuth();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#5A827E]">
              Upgrade Required
            </h2>
            <button
              onClick={onClose}
              className="text-[#5A827E]/70 hover:text-[#5A827E]"
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>

          {/* Visitor Status */}
          {visitorSession && (
            <div className="bg-[#FAFFCA]/30 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <Icons.Info className="w-5 h-5 text-[#5A827E]" />
                <div>
                  <div className="font-medium text-[#5A827E]">
                    You've used {visitorSession.filesUploaded} of {visitorSession.fileLimit} visitor uploads
                  </div>
                  <div className="text-sm text-[#5A827E]/70">
                    Create a free account to get 5 more uploads at no cost!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feature Info */}
          {targetFeature && (
            <div className="mb-6">
              <h3 className="font-medium text-[#5A827E] mb-2">
                Feature: {targetFeature}
              </h3>
              <p className="text-[#5A827E]/70 text-sm">
                This feature requires a premium subscription. Upgrade now to unlock all features.
              </p>
            </div>
          )}

          {/* Subscription Plans */}
          <SubscriptionPlans 
            currentPlan="visitor" 
            showCurrentPlan={false}
            onPlanSelect={(planId) => {
              window.location.href = `/signup?plan=${planId}`;
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionPlans;
