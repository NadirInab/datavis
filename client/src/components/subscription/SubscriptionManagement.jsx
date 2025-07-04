import { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { SUBSCRIPTION_PLANS } from '../../services/paymentService';
import Button, { Icons } from '../ui/Button';

const SubscriptionManagement = () => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      // Mock subscription data based on current user
      const userSubscription = currentUser?.subscription || 'free';
      setSubscription({
        tier: userSubscription,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setMessage('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setMessage('');
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
  };

  const handleSubscribe = async () => {
    try {
      if (!selectedPlan) {
        setMessage('Please select a plan');
        return;
      }

      setProcessing(true);
      setMessage('Processing payment...');

      // Redirect to mock payment page
      window.location.href = `/mock-payment?plan=${selectedPlan}&cycle=${billingCycle}`;
      
      if (result) {
        setMessage('Subscription updated successfully!');
        await fetchSubscription();
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setMessage(`Subscription failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to cancel your subscription?');
      if (!confirmed) return;

      setProcessing(true);
      setMessage('Cancelling subscription...');

      const paymentService = await import('../../services/paymentService');
      const service = new paymentService.default();
      
      await service.cancelSubscription('User requested cancellation');
      
      setMessage('Subscription cancelled successfully');
      await fetchSubscription();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      setMessage(`Cancellation failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icons.Loader className="w-6 h-6 animate-spin mr-2" />
        Loading subscription information...
      </div>
    );
  }

  return (
    <div className="subscription-management max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Management</h2>
        
        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.includes('success') ? 'bg-green-50 text-green-700' : 
            message.includes('failed') || message.includes('error') ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {/* Current Subscription Status */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold capitalize">{subscription?.tier || 'Free'} Plan</p>
              <p className="text-gray-600">Status: {subscription?.status || 'Active'}</p>
            </div>
            {subscription?.tier !== 'free' && (
              <Button
                onClick={handleCancelSubscription}
                variant="outline"
                disabled={processing}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Billing Cycle</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => handleBillingCycleChange('monthly')}
              className={`px-4 py-2 rounded-md ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => handleBillingCycleChange('yearly')}
              className={`px-4 py-2 rounded-md ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yearly (20% off)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {Object.values(SUBSCRIPTION_PLANS).map(plan => {
            const isCurrentPlan = subscription?.tier === plan.id;
            const price = billingCycle === 'yearly' ? (plan.price * 0.8 * 12) : plan.price;
            
            return (
              <div 
                key={plan.id} 
                className={`border rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : isCurrentPlan
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <div className="text-center">
                  <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${price.toFixed(2)}</span>
                    <span className="text-gray-600">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                  {isCurrentPlan && (
                    <div className="mb-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        Current Plan
                      </span>
                    </div>
                  )}
                  <ul className="text-left space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Icons.Check className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscribe Button */}
        {selectedPlan && selectedPlan !== subscription?.tier && (
          <div className="text-center">
            <Button
              onClick={handleSubscribe}
              disabled={processing}
              className="px-8 py-3 text-lg"
            >
              {processing ? (
                <>
                  <Icons.Loader className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `${subscription?.tier !== 'free' ? 'Change to' : 'Subscribe to'} ${
                  SUBSCRIPTION_PLANS[selectedPlan]?.name
                } Plan`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
