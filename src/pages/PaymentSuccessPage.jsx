import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import Button, { Icons } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { SUBSCRIPTION_PLANS } from '../services/paymentService';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Get payment details from navigation state
  const { planType, billingCycle, amount } = location.state || {};
  const plan = SUBSCRIPTION_PLANS[planType];

  useEffect(() => {
    // Simulate updating user subscription status
    const updateSubscription = async () => {
      try {
        // Refresh user data to get updated subscription
        if (refreshUser) {
          await refreshUser();
        }
        setLoading(false);
      } catch (error) {
        console.error('Error updating subscription:', error);
        setLoading(false);
      }
    };

    updateSubscription();
  }, [refreshUser]);

  const handleContinue = () => {
    navigate('/app');
  };

  const handleViewSubscription = () => {
    navigate('/app/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFFCA]/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Icons.Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-[#84AE92]" />
          <p className="text-[#5A827E]">Finalizing your subscription...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFFCA]/30 flex items-center justify-center py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.Check className="w-8 h-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-[#5A827E] mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-lg text-[#5A827E]/80 mb-8">
            Welcome to {plan?.name || 'your new'} plan! Your subscription has been activated.
          </p>

          {/* Payment Details */}
          {plan && (
            <div className="bg-[#B9D4AA]/20 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-[#5A827E] mb-4">Payment Details</h2>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/70">Plan:</span>
                  <span className="font-medium text-[#5A827E]">{plan.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/70">Billing Cycle:</span>
                  <span className="font-medium text-[#5A827E] capitalize">{billingCycle}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/70">Amount Paid:</span>
                  <span className="font-medium text-[#5A827E]">${amount?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/70">Next Billing Date:</span>
                  <span className="font-medium text-[#5A827E]">
                    {new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Features Unlocked */}
          {plan && (
            <div className="bg-[#84AE92]/10 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-[#5A827E] mb-4">
                <Icons.Star className="w-5 h-5 inline mr-2 text-[#84AE92]" />
                Features Unlocked
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Icons.Check className="w-4 h-4 text-[#84AE92] mr-2 flex-shrink-0" />
                    <span className="text-sm text-[#5A827E]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleContinue}
              variant="primary"
              className="flex-1"
              icon={Icons.ArrowRight}
            >
              Continue to Dashboard
            </Button>
            
            <Button
              onClick={handleViewSubscription}
              variant="outline"
              className="flex-1"
              icon={Icons.User}
            >
              View Subscription
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-[#FAFFCA]/50 rounded-lg">
            <h3 className="font-medium text-[#5A827E] mb-2">What's Next?</h3>
            <ul className="text-sm text-[#5A827E]/80 space-y-1">
              <li>• Start uploading and analyzing your data files</li>
              <li>• Create advanced visualizations with your new features</li>
              <li>• Export your charts in multiple formats</li>
              <li>• Access priority support when you need help</li>
            </ul>
          </div>

          {/* Support Contact */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#5A827E]/70">
              Questions about your subscription?{' '}
              <button 
                onClick={() => navigate('/support')}
                className="text-[#84AE92] hover:text-[#5A827E] font-medium"
              >
                Contact Support
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
