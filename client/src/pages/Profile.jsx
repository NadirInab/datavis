import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import Button, { Icons } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { SUBSCRIPTION_PLANS } from '../services/paymentService';

const Profile = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        company: currentUser.company || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage('');

    try {
      await updateProfile({
        name: formData.name,
        company: formData.company,
        password: formData.password || undefined
      });

      setMessage('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (error) {
      setErrors({ submit: 'Failed to update profile: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      setErrors({ submit: 'Failed to log out' });
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      localStorage.removeItem(`files_${currentUser?.id || 'unknown'}`);
      logout();
      navigate('/signup');
    }
  };

  const handleUpgrade = () => {
    navigate('/subscription-plans');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAFFCA]/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Icons.Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-[#84AE92]" />
          <p className="text-[#5A827E]">Loading profile...</p>
        </Card>
      </div>
    );
  }

  const sections = [
    { id: 'personal', name: 'Personal Info', icon: Icons.User },
    { id: 'subscription', name: 'Subscription', icon: Icons.CreditCard },
    { id: 'security', name: 'Security', icon: Icons.Shield },
    { id: 'preferences', name: 'Preferences', icon: Icons.Settings }
  ];

  const currentPlan = SUBSCRIPTION_PLANS[currentUser.subscription] || SUBSCRIPTION_PLANS.free;

  return (
    <div className="min-h-screen bg-[#FAFFCA]/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#5A827E] mb-2">Profile Settings</h1>
          <p className="text-[#5A827E]/70">Manage your account settings and preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                        ${isActive 
                          ? 'bg-[#84AE92] text-white' 
                          : 'text-[#5A827E] hover:bg-[#B9D4AA]/30'
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{section.name}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Success/Error Messages */}
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <div className="flex items-center space-x-2">
                  <Icons.Check className="w-5 h-5" />
                  <span>{message}</span>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <div className="flex items-center space-x-2">
                  <Icons.AlertCircle className="w-5 h-5" />
                  <span>{errors.submit}</span>
                </div>
              </div>
            )}

            {/* Personal Information Section */}
            {activeSection === 'personal' && (
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#5A827E] mb-2">Personal Information</h2>
                  <p className="text-[#5A827E]/70">Update your personal details and contact information</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#5A827E] mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`
                          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92]
                          ${errors.name ? 'border-red-300' : 'border-[#84AE92]/30'}
                        `}
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5A827E] mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`
                          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92]
                          ${errors.email ? 'border-red-300' : 'border-[#84AE92]/30'}
                        `}
                        placeholder="Enter your email address"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5A827E] mb-2">
                      Company (Optional)
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[#84AE92]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92]"
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      icon={loading ? Icons.Loader : Icons.Save}
                      className={loading ? 'animate-pulse' : ''}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Subscription Section */}
            {activeSection === 'subscription' && (
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#5A827E] mb-2">Subscription Plan</h2>
                  <p className="text-[#5A827E]/70">Manage your subscription and billing</p>
                </div>

                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="bg-[#B9D4AA]/20 rounded-lg p-6 border border-[#84AE92]/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#5A827E] capitalize">
                          {currentPlan.name} Plan
                        </h3>
                        <p className="text-[#5A827E]/70">{currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`}</p>
                      </div>
                      <div className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${currentUser.subscription === 'free' 
                          ? 'bg-gray-100 text-gray-800'
                          : currentUser.subscription === 'pro'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                        }
                      `}>
                        {currentUser.subscription.charAt(0).toUpperCase() + currentUser.subscription.slice(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentPlan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                          <span className="text-sm text-[#5A827E]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upgrade Options */}
                  {currentUser.subscription === 'free' && (
                    <div className="text-center">
                      <Button
                        onClick={handleUpgrade}
                        variant="primary"
                        icon={Icons.ArrowUp}
                        size="lg"
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#5A827E] mb-2">Security Settings</h2>
                  <p className="text-[#5A827E]/70">Manage your password and account security</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#5A827E] mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`
                          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92]
                          ${errors.password ? 'border-red-300' : 'border-[#84AE92]/30'}
                        `}
                        placeholder="Enter new password"
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5A827E] mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`
                          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92]
                          ${errors.confirmPassword ? 'border-red-300' : 'border-[#84AE92]/30'}
                        `}
                        placeholder="Confirm new password"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      onClick={handleDeleteAccount}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      icon={Icons.Trash}
                    >
                      Delete Account
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      icon={loading ? Icons.Loader : Icons.Save}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#5A827E] mb-2">Preferences</h2>
                  <p className="text-[#5A827E]/70">Customize your experience</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#FAFFCA]/50 rounded-lg p-4 border border-[#84AE92]/20">
                    <div className="flex items-center space-x-3">
                      <Icons.Info className="w-5 h-5 text-[#84AE92]" />
                      <div>
                        <h4 className="font-medium text-[#5A827E]">Coming Soon</h4>
                        <p className="text-sm text-[#5A827E]/70">
                          Preference settings will be available in a future update.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      icon={Icons.LogOut}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
