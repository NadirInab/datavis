import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import SubscriptionPlansComponent from '../components/subscription/SubscriptionPlans';
import Button, { Icons } from '../components/ui/Button';
import Card from '../components/ui/Card';
import paymentService from '../services/paymentService';

const SubscriptionPlansPage = () => {
  const { currentUser, isVisitor, visitorSession } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const preselectedPlan = searchParams.get('plan');

  useEffect(() => {
    if (currentUser && !isVisitor()) {
      loadSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [currentUser, isVisitor]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const status = await paymentService.getSubscriptionStatus(currentUser.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (planId) => {
    if (planId === 'free') {
      if (subscriptionStatus?.subscriptionId) {
        const confirmed = window.confirm(
          'Are you sure you want to downgrade to the free plan?'
        );
        if (confirmed) {
          await paymentService.cancelSubscription(subscriptionStatus.subscriptionId);
          await loadSubscriptionData();
        }
      }
      return;
    }

    // Redirect to mock payment page
    navigate('/mock-payment', {
      state: { planType: planId, billingCycle: 'monthly' }
    });
  };

  const currentPlan = subscriptionStatus?.plan || currentUser?.subscription || 'free';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#5A827E] mb-4">
          {isVisitor() ? 'Choose Your Plan' : 'Manage Your Subscription'}
        </h1>
        <p className="text-[#5A827E]/70 text-lg max-w-2xl mx-auto">
          {isVisitor() 
            ? 'Start with our free plan or upgrade for advanced features and unlimited access.'
            : 'Upgrade, downgrade, or manage your current subscription plan.'
          }
        </p>
      </div>

      {/* Visitor Status */}
      {isVisitor() && visitorSession && (
        <Card className="mb-8 bg-gradient-to-r from-[#FAFFCA] to-[#B9D4AA]/20 border-[#84AE92]/30">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Icons.Info className="w-6 h-6 text-[#5A827E]" />
                <div>
                  <h3 className="font-semibold text-[#5A827E]">Visitor Status</h3>
                  <p className="text-[#5A827E]/70">
                    You've used {visitorSession.filesUploaded} of {visitorSession.fileLimit} uploads.
                    {visitorSession.remainingFiles > 0 
                      ? ` ${visitorSession.remainingFiles} uploads remaining.`
                      : ' Upgrade to continue uploading files.'
                    }
                  </p>
                </div>
              </div>
              {preselectedPlan && (
                <div className="text-right">
                  <div className="text-sm font-medium text-[#5A827E]">
                    Recommended Plan
                  </div>
                  <div className="text-lg font-bold text-[#5A827E] capitalize">
                    {preselectedPlan}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="mb-12">
        <SubscriptionPlansComponent
          currentPlan={currentPlan}
          onPlanSelect={handlePlanSelect}
          showCurrentPlan={!isVisitor()}
        />
      </div>

      {/* Features Comparison */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-[#5A827E] mb-6 text-center">
            Feature Comparison
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#84AE92]/20">
                  <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-[#5A827E]">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-[#5A827E]">Pro</th>
                  <th className="text-center py-3 px-4 font-medium text-[#5A827E]">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-[#5A827E]">File Uploads</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">5/month</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">Unlimited</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-[#5A827E]">File Formats</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">CSV only</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">All formats</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">All formats</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-[#5A827E]">Export Formats</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">PNG only</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">All formats</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">All formats</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-[#5A827E]">Storage</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">10MB</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">100MB</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">1GB</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-[#5A827E]">Support</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">Email</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">Priority</td>
                  <td className="py-3 px-4 text-center text-[#5A827E]/70">Phone + Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Money-back Guarantee */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-[#5A827E]/70">
          <Icons.Shield className="w-5 h-5" />
          <span className="text-sm">30-day money-back guarantee • Cancel anytime</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;
