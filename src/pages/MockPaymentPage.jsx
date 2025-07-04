import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import Button, { Icons } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { SUBSCRIPTION_PLANS } from '../services/paymentService';

const MockPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Get plan details from navigation state
  const { planType, billingCycle = 'monthly' } = location.state || {};
  const plan = SUBSCRIPTION_PLANS[planType];
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: currentUser?.email || '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });
  
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if no plan selected
  useEffect(() => {
    if (!plan) {
      navigate('/subscription-plans');
    }
  }, [plan, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('billing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }));
    } else {
      // Format card number and expiry date
      let formattedValue = value;
      if (name === 'cardNumber') {
        formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
        if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
      } else if (name === 'expiryDate') {
        formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
        if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
      } else if (name === 'cvv') {
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }
    
    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      newErrors.expiryDate = 'Please enter a valid expiry date';
    }
    
    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }
    
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter the cardholder name';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Call the mock payment API
      const paymentService = await import('../services/paymentService');
      const service = new paymentService.default();
      
      await service.createMockPayment(planType, billingCycle);
      
      // Redirect to success page
      navigate('/subscription/success', {
        state: {
          planType,
          billingCycle,
          amount: billingCycle === 'yearly' ? (plan.price * 0.8 * 12) : plan.price
        }
      });
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      setErrors({ submit: 'Payment processing failed. Please try again.' });
      setProcessing(false);
    }
  };

  if (!plan) {
    return null;
  }

  const amount = billingCycle === 'yearly' ? (plan.price * 0.8 * 12) : plan.price;

  return (
    <div className="min-h-screen bg-[#FAFFCA]/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[#5A827E] mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#5A827E]">{plan.name} Plan</span>
                  <span className="font-semibold text-[#5A827E]">${plan.price}/month</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[#5A827E]">Billing Cycle</span>
                  <span className="text-[#5A827E] capitalize">{billingCycle}</span>
                </div>
                
                {billingCycle === 'yearly' && (
                  <div className="flex justify-between items-center text-[#84AE92]">
                    <span>Yearly Discount (20%)</span>
                    <span>-${(plan.price * 12 * 0.2).toFixed(2)}</span>
                  </div>
                )}
                
                <hr className="border-[#84AE92]/30" />
                
                <div className="flex justify-between items-center text-lg font-bold text-[#5A827E]">
                  <span>Total</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-[#B9D4AA]/20 rounded-lg">
                <h3 className="font-semibold text-[#5A827E] mb-2">What's included:</h3>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-[#5A827E]">
                      <Icons.Check className="w-4 h-4 text-[#84AE92] mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[#5A827E] mb-6">Payment Information</h2>
              
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium text-[#5A827E] mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92] ${
                      errors.cardNumber ? 'border-red-300' : 'border-[#84AE92]/30'
                    }`}
                    disabled={processing}
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                  )}
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5A827E] mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92] ${
                        errors.expiryDate ? 'border-red-300' : 'border-[#84AE92]/30'
                      }`}
                      disabled={processing}
                    />
                    {errors.expiryDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#5A827E] mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92] ${
                        errors.cvv ? 'border-red-300' : 'border-[#84AE92]/30'
                      }`}
                      disabled={processing}
                    />
                    {errors.cvv && (
                      <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
                    )}
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-sm font-medium text-[#5A827E] mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={formData.cardholderName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92] ${
                      errors.cardholderName ? 'border-red-300' : 'border-[#84AE92]/30'
                    }`}
                    disabled={processing}
                  />
                  {errors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#5A827E] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92] ${
                      errors.email ? 'border-red-300' : 'border-[#84AE92]/30'
                    }`}
                    disabled={processing}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/subscription-plans')}
                    disabled={processing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Icons.Loader className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Pay $${amount.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </form>
              
              <div className="mt-4 text-center text-xs text-[#5A827E]/70">
                <Icons.Lock className="w-4 h-4 inline mr-1" />
                This is a demo payment form. No real charges will be made.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockPaymentPage;
