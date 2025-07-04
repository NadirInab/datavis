import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/FirebaseAuthContext';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('processing');
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    const verifySubscription = async () => {
      try {
        // Get payment intent ID from URL
        const paymentIntentId = searchParams.get('payment_intent');
        
        if (!paymentIntentId) {
          setStatus('error');
          return;
        }
        
        // Verify payment with backend
        const token = localStorage.getItem('authToken');
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        let url;
        if (API_BASE.endsWith('/api/v1')) {
          url = `${API_BASE}/subscriptions/verify-payment`;
        } else {
          url = `${API_BASE}/api/v1/subscriptions/verify-payment`;
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentIntentId })
        });
        
        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStatus('success');
          setSubscription(data.data);
          
          // Refresh user data to update subscription status
          await refreshUser();
          
          // Redirect to dashboard after 5 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 5000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error verifying subscription:', error);
        setStatus('error');
      }
    };
    
    verifySubscription();
  }, [searchParams, navigate, refreshUser]);
  
  return (
    <div className="subscription-success">
      <h2>Subscription {status === 'success' ? 'Activated' : 'Processing'}</h2>
      
      {status === 'processing' && (
        <div className="processing">
          <div className="spinner"></div>
          <p>Processing your subscription...</p>
        </div>
      )}
      
      {status === 'success' && subscription && (
        <div className="success">
          <div className="checkmark">✓</div>
          <h3>Thank you for your subscription!</h3>
          <p>Your {subscription.tier} plan is now active.</p>
          <p>You will be redirected to the dashboard in a few seconds...</p>
          <button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error">
          <div className="error-icon">!</div>
          <h3>Something went wrong</h3>
          <p>We couldn't verify your subscription. Please contact support.</p>
          <button onClick={() => navigate('/subscription')}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSuccess;