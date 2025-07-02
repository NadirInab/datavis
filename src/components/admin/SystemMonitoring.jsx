import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';

const SystemMonitoring = () => {
  const { currentUser } = useAuth();
  const [systemStatus, setSystemStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    fetchSystemStatus();
    fetchAnalytics();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchSystemStatus = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Check if we have a valid token
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      // Use the API base URL from environment variables
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      
      // Fix the URL construction to avoid duplicate /api/v1/
      let url;
      if (API_BASE.endsWith('/api/v1')) {
        url = `${API_BASE}/admin/system/status`;
      } else {
        url = `${API_BASE}/api/v1/admin/system/status`;
      }
      
      console.log('Fetching system status from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('API Error:', response.status, text);
        throw new Error(`API returned ${response.status}: ${text}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSystemStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/v1/admin/analytics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !systemStatus) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-[#84AE92]/20 shadow-sm">
          <div className="animate-pulse">
            <div className="h-6 bg-[#B9D4AA]/30 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-[#B9D4AA]/20 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="bg-white rounded-2xl p-6 border border-[#84AE92]/20 shadow-sm">
        <h2 className="text-xl font-semibold text-[#5A827E] mb-6">System Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Server Status */}
          <div className="bg-[#FAFFCA]/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[#5A827E]">Server</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemStatus?.server?.status)}`}>
                {systemStatus?.server?.status || 'Unknown'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-[#5A827E]/70">
              <div>Uptime: {systemStatus?.server?.uptime ? formatUptime(systemStatus.server.uptime) : 'N/A'}</div>
              <div>Memory: {systemStatus?.server?.memory?.used || 0}MB / {systemStatus?.server?.memory?.total || 0}MB</div>
              <div>Node: {systemStatus?.server?.nodeVersion || 'N/A'}</div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-[#FAFFCA]/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[#5A827E]">Database</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                systemStatus?.database?.connected ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {systemStatus?.database?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-[#5A827E]/70">
              <div>Host: {systemStatus?.database?.host || 'N/A'}</div>
              <div>Database: {systemStatus?.database?.name || 'N/A'}</div>
              <div>Collections: {systemStatus?.database?.collections?.length || 0}</div>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-[#FAFFCA]/30 rounded-xl p-4">
            <h3 className="font-medium text-[#5A827E] mb-3">Live Metrics</h3>
            <div className="space-y-2 text-sm text-[#5A827E]/70">
              <div>Active Users: {systemStatus?.metrics?.activeUsers || 0}</div>
              <div>Uploads Today: {systemStatus?.metrics?.uploadsToday || 0}</div>
              <div>Total Users: {systemStatus?.metrics?.totalUsers || 0}</div>
              <div>Total Files: {systemStatus?.metrics?.totalFiles || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white rounded-2xl p-6 border border-[#84AE92]/20 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#5A827E] mb-4 sm:mb-0">Usage Analytics</h2>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-[#84AE92]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#84AE92]/50"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-[#B9D4AA]/20 rounded-xl"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Registrations */}
            <div className="bg-[#FAFFCA]/30 rounded-xl p-4">
              <h3 className="font-medium text-[#5A827E] mb-4">User Registrations</h3>
              <div className="space-y-2">
                {analytics?.userRegistrations?.slice(-5).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-[#5A827E]/70">{item._id}</span>
                    <span className="font-medium text-[#5A827E]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* File Uploads */}
            <div className="bg-[#FAFFCA]/30 rounded-xl p-4">
              <h3 className="font-medium text-[#5A827E] mb-4">File Uploads</h3>
              <div className="space-y-2">
                {analytics?.fileUploads?.slice(-5).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-[#5A827E]/70">{item._id}</span>
                    <span className="font-medium text-[#5A827E]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-[#FAFFCA]/30 rounded-xl p-4">
              <h3 className="font-medium text-[#5A827E] mb-4">User Roles</h3>
              <div className="space-y-2">
                {analytics?.roleDistribution?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-[#5A827E]/70 capitalize">{item._id || 'Unknown'}</span>
                    <span className="font-medium text-[#5A827E]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Distribution */}
            <div className="bg-[#FAFFCA]/30 rounded-xl p-4">
              <h3 className="font-medium text-[#5A827E] mb-4">Subscriptions</h3>
              <div className="space-y-2">
                {analytics?.subscriptionDistribution?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-[#5A827E]/70 capitalize">{item._id || 'Free'}</span>
                    <span className="font-medium text-[#5A827E]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Logs */}
      <div className="bg-white rounded-2xl p-6 border border-[#84AE92]/20 shadow-sm">
        <h2 className="text-xl font-semibold text-[#5A827E] mb-6">Recent Errors</h2>
        
        {systemStatus?.errors?.length > 0 ? (
          <div className="space-y-3">
            {systemStatus.errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-red-800">{error.message}</div>
                    <div className="text-sm text-red-600 mt-1">{error.stack}</div>
                  </div>
                  <div className="text-xs text-red-500">{error.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#5A827E]/70">
            <svg className="w-12 h-12 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No recent errors detected
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMonitoring;



