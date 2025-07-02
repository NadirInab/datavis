import React, { useState, useEffect } from 'react';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';
import { getFeatureUsageStats, getAllFeatures, SUBSCRIPTION_TIERS } from '../../utils/featureGating';

const UsageAnalytics = () => {
  const [usageStats, setUsageStats] = useState({});
  const [features, setFeatures] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('usage');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = () => {
    const stats = getFeatureUsageStats();
    const allFeatures = getAllFeatures();
    
    setUsageStats(stats);
    setFeatures(allFeatures);
  };

  const getTopFeatures = (metric = 'totalUsage', limit = 5) => {
    return Object.entries(usageStats)
      .sort(([,a], [,b]) => b[metric] - a[metric])
      .slice(0, limit)
      .map(([featureId, stats]) => ({
        featureId,
        ...stats,
        feature: features.find(f => f.id === featureId)
      }));
  };

  const getTotalStats = () => {
    const totalUsage = Object.values(usageStats).reduce((sum, stat) => sum + stat.totalUsage, 0);
    const totalUsers = new Set(
      Object.values(usageStats).flatMap(stat => 
        Array.from({ length: stat.uniqueUsers }, (_, i) => `user_${i}`)
      )
    ).size;
    const activeFeatures = Object.keys(usageStats).length;
    const totalFeatures = features.length;

    return { totalUsage, totalUsers, activeFeatures, totalFeatures };
  };

  const stats = getTotalStats();
  const topFeaturesByUsage = getTopFeatures('totalUsage');
  const topFeaturesByUsers = getTopFeatures('uniqueUsers');

  const getUsageColor = (usage, max) => {
    const percentage = (usage / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const maxUsage = Math.max(...Object.values(usageStats).map(s => s.totalUsage), 1);
  const maxUsers = Math.max(...Object.values(usageStats).map(s => s.uniqueUsers), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-[#5A827E]">Usage Analytics</h2>
          <p className="text-[#5A827E]/70 mt-1">
            Track feature usage and user engagement
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5A827E]/20 focus:border-[#5A827E]"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button
            onClick={loadAnalytics}
            variant="ghost"
            icon={Icons.RefreshCw}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5A827E]/60 mb-1">Total Usage</p>
              <p className="text-2xl font-bold text-[#5A827E]">{stats.totalUsage.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-[#5A827E]/10 rounded-xl flex items-center justify-center">
              <Icons.Activity className="w-6 h-6 text-[#5A827E]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5A827E]/60 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-[#5A827E]">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-[#84AE92]/10 rounded-xl flex items-center justify-center">
              <Icons.Users className="w-6 h-6 text-[#84AE92]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5A827E]/60 mb-1">Active Features</p>
              <p className="text-2xl font-bold text-[#5A827E]">{stats.activeFeatures}</p>
              <p className="text-xs text-[#5A827E]/50">of {stats.totalFeatures} total</p>
            </div>
            <div className="w-12 h-12 bg-[#B9D4AA]/10 rounded-xl flex items-center justify-center">
              <Icons.Zap className="w-6 h-6 text-[#B9D4AA]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5A827E]/60 mb-1">Avg Usage/User</p>
              <p className="text-2xl font-bold text-[#5A827E]">
                {stats.totalUsers > 0 ? Math.round(stats.totalUsage / stats.totalUsers) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FAFFCA]/30 rounded-xl flex items-center justify-center">
              <Icons.TrendingUp className="w-6 h-6 text-[#5A827E]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Most Used Features</h3>
          <div className="space-y-4">
            {topFeaturesByUsage.map((item, index) => (
              <div key={item.featureId} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#5A827E]/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-[#5A827E]">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#5A827E] truncate">
                    {item.feature?.name || item.featureId}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getUsageColor(item.totalUsage, maxUsage)}`}
                        style={{ width: `${(item.totalUsage / maxUsage) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#5A827E]/60 font-medium">
                      {item.totalUsage.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Most Popular Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Most Popular Features</h3>
          <div className="space-y-4">
            {topFeaturesByUsers.map((item, index) => (
              <div key={item.featureId} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#84AE92]/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-[#84AE92]">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#5A827E] truncate">
                    {item.feature?.name || item.featureId}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getUsageColor(item.uniqueUsers, maxUsers)}`}
                        style={{ width: `${(item.uniqueUsers / maxUsers) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#5A827E]/60 font-medium">
                      {item.uniqueUsers.toLocaleString()} users
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Feature Categories */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Usage by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(
            features.reduce((acc, feature) => {
              const category = feature.category;
              if (!acc[category]) {
                acc[category] = { count: 0, usage: 0, users: 0 };
              }
              acc[category].count++;
              if (usageStats[feature.id]) {
                acc[category].usage += usageStats[feature.id].totalUsage;
                acc[category].users += usageStats[feature.id].uniqueUsers;
              }
              return acc;
            }, {})
          ).map(([category, data]) => (
            <div key={category} className="bg-[#FAFFCA]/20 rounded-lg p-4">
              <h4 className="font-medium text-[#5A827E] mb-2">{category}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/60">Features:</span>
                  <span className="font-medium text-[#5A827E]">{data.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/60">Usage:</span>
                  <span className="font-medium text-[#5A827E]">{data.usage.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A827E]/60">Users:</span>
                  <span className="font-medium text-[#5A827E]">{data.users.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Subscription Tier Usage */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Usage by Subscription Tier</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SUBSCRIPTION_TIERS).map(([tierKey, tier]) => {
            // Calculate estimated usage for each tier (mock data for demo)
            const estimatedUsage = Math.floor(Math.random() * 1000) + 100;
            const estimatedUsers = Math.floor(Math.random() * 50) + 10;
            
            return (
              <div key={tierKey} className="bg-[#FAFFCA]/20 rounded-lg p-4">
                <h4 className="font-medium text-[#5A827E] mb-2">{tier.name}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/60">Features:</span>
                    <span className="font-medium text-[#5A827E]">{tier.features.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/60">Est. Usage:</span>
                    <span className="font-medium text-[#5A827E]">{estimatedUsage.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A827E]/60">Est. Users:</span>
                    <span className="font-medium text-[#5A827E]">{estimatedUsers.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default UsageAnalytics;
