import React, { useState, useEffect } from 'react';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';
import { 
  getAllFeatures, 
  setFeatureFlag, 
  getFeatureUsageStats,
  FEATURES,
  SUBSCRIPTION_TIERS 
} from '../../utils/featureGating';

const FeatureManagement = () => {
  const [features, setFeatures] = useState([]);
  const [usageStats, setUsageStats] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUsageModal, setShowUsageModal] = useState(null);

  useEffect(() => {
    loadFeatures();
    loadUsageStats();
  }, []);

  const loadFeatures = () => {
    const allFeatures = getAllFeatures();
    setFeatures(allFeatures);
  };

  const loadUsageStats = () => {
    const stats = getFeatureUsageStats();
    setUsageStats(stats);
  };

  const handleToggleFeature = (featureId, enabled) => {
    setFeatureFlag(featureId, enabled);
    loadFeatures(); // Reload to reflect changes
  };

  const categories = ['All', ...new Set(Object.values(FEATURES).map(f => f.category))];

  const filteredFeatures = features.filter(feature => {
    const matchesCategory = selectedCategory === 'All' || feature.category === selectedCategory;
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTierColor = (tier) => {
    const colors = {
      free: 'bg-green-100 text-green-800',
      premium: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getUsageColor = (usage) => {
    if (usage >= 100) return 'text-green-600';
    if (usage >= 50) return 'text-yellow-600';
    if (usage >= 10) return 'text-orange-600';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-[#5A827E]">Feature Management</h2>
          <p className="text-[#5A827E]/70 mt-1">
            Manage feature flags and subscription tiers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadUsageStats}
            variant="ghost"
            icon={Icons.RefreshCw}
            size="sm"
          >
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5A827E]/20 focus:border-[#5A827E]"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#5A827E] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFeatures.map(feature => (
          <Card key={feature.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-[#5A827E]">{feature.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(feature.tier)}`}>
                    {feature.tier}
                  </span>
                </div>
                <p className="text-sm text-[#5A827E]/70 mb-3">{feature.description}</p>
                <div className="text-xs text-[#5A827E]/50">
                  Category: {feature.category}
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#FAFFCA]/30 rounded-lg p-3">
                <div className="text-xs text-[#5A827E]/60 mb-1">Total Usage</div>
                <div className={`font-semibold ${getUsageColor(feature.usage.totalUsage)}`}>
                  {feature.usage.totalUsage.toLocaleString()}
                </div>
              </div>
              <div className="bg-[#FAFFCA]/30 rounded-lg p-3">
                <div className="text-xs text-[#5A827E]/60 mb-1">Unique Users</div>
                <div className={`font-semibold ${getUsageColor(feature.usage.uniqueUsers)}`}>
                  {feature.usage.uniqueUsers.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#5A827E]">
                {feature.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => handleToggleFeature(feature.id, !feature.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  feature.enabled ? 'bg-[#84AE92]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    feature.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Usage Details Button */}
            {feature.usage.totalUsage > 0 && (
              <Button
                onClick={() => setShowUsageModal(feature)}
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                icon={Icons.BarChart}
              >
                View Usage Details
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredFeatures.length === 0 && (
        <Card className="p-12 text-center">
          <Icons.Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </Card>
      )}

      {/* Subscription Tiers Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Subscription Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SUBSCRIPTION_TIERS).map(([tierKey, tier]) => (
            <div key={tierKey} className="bg-[#FAFFCA]/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-[#5A827E]">{tier.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(tierKey)}`}>
                  {tierKey}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/60">Features:</span>
                  <span className="font-medium text-[#5A827E]">{tier.features.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/60">Files:</span>
                  <span className="font-medium text-[#5A827E]">
                    {tier.limits.files === -1 ? 'Unlimited' : tier.limits.files}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/60">Storage:</span>
                  <span className="font-medium text-[#5A827E]">
                    {tier.limits.storage === -1 ? 'Unlimited' : `${(tier.limits.storage / 1024 / 1024).toFixed(0)}MB`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#5A827E]">
                  Usage Details: {showUsageModal.name}
                </h3>
                <button
                  onClick={() => setShowUsageModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FAFFCA]/30 rounded-lg p-4">
                    <div className="text-sm text-[#5A827E]/60 mb-1">Total Usage</div>
                    <div className="text-2xl font-bold text-[#5A827E]">
                      {showUsageModal.usage.totalUsage.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#FAFFCA]/30 rounded-lg p-4">
                    <div className="text-sm text-[#5A827E]/60 mb-1">Unique Users</div>
                    <div className="text-2xl font-bold text-[#5A827E]">
                      {showUsageModal.usage.uniqueUsers.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[#5A827E] mb-3">Feature Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{showUsageModal.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tier:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(showUsageModal.tier)}`}>
                        {showUsageModal.tier}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${showUsageModal.enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {showUsageModal.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>{showUsageModal.description}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FeatureManagement;
