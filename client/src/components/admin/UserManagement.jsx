import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.current]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Check if we have a valid token
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: 20,
        ...(filters.role !== 'all' ? { role: filters.role } : {}),
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.search ? { search: filters.search } : {})
      });

      // Make sure we're using the correct API URL
      // If you're using a proxy in development, make sure it's configured correctly
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      
      // Fix the URL construction to avoid duplicate /api/v1/
      let url;
      if (API_BASE.endsWith('/api/v1')) {
        url = `${API_BASE}/admin/users?${queryParams}`;
      } else {
        url = `${API_BASE}/api/v1/admin/users?${queryParams}`;
      }
      
      console.log('Fetching users from:', url);
      
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
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchUsers(); // Refresh the list
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status');
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchUsers(); // Refresh the list
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'visitor':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[#84AE92]/20 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-[#B9D4AA]/30 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[#B9D4AA]/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#84AE92]/20 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#5A827E] mb-4 sm:mb-0">
          User Management
        </h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="px-3 py-2 border border-[#84AE92]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#84AE92]/50"
          >
            <option value="all">All Roles</option>
            <option value="visitor">Visitors</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-[#84AE92]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#84AE92]/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="px-3 py-2 border border-[#84AE92]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#84AE92]/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#84AE92]/20">
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">User</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Role</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Subscription</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Status</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-[#84AE92]/10 hover:bg-[#FAFFCA]/30">
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-[#5A827E]">{user.name}</div>
                    <div className="text-sm text-[#5A827E]/70">{user.email}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user._id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getRoleBadgeColor(user.role)}`}
                  >
                    <option value="visitor">Visitor</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#B9D4AA]/20 text-[#5A827E] capitalize">
                    {user.subscription?.tier || 'free'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.isActive)}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => updateUserStatus(user._id, !user.isActive)}
                    disabled={user.role === 'admin'}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      user.role === 'admin'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : user.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-[#5A827E]/70">
          Showing {users.length} of {pagination.totalUsers} users
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
            disabled={pagination.current === 1}
            className="px-3 py-1 rounded-lg text-sm border border-[#84AE92]/30 text-[#5A827E] hover:bg-[#B9D4AA]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[#5A827E]">
            Page {pagination.current} of {pagination.total}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
            disabled={pagination.current === pagination.total}
            className="px-3 py-1 rounded-lg text-sm border border-[#84AE92]/30 text-[#5A827E] hover:bg-[#B9D4AA]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;




