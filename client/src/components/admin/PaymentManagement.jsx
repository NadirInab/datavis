import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';

const PaymentManagement = () => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    userId: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalPayments: 0
  });
  const [refundModal, setRefundModal] = useState({ open: false, payment: null, reason: '' });

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.current]);

  const fetchPayments = async () => {
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
        ...filters
      });

      // Use the API base URL from environment variables
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      
      // Fix the URL construction to avoid duplicate /api/v1/
      let url;
      if (API_BASE.endsWith('/api/v1')) {
        url = `${API_BASE}/payments/admin/history?${queryParams}`;
      } else {
        url = `${API_BASE}/api/v1/payments/admin/history?${queryParams}`;
      }
      
      console.log('Fetching payments from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setPayments(data.data.payments);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/v1/payments/admin/refund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: refundModal.payment._id,
          reason: refundModal.reason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRefundModal({ open: false, payment: null, reason: '' });
        fetchPayments(); // Refresh the list
        alert('Refund processed successfully');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
      alert('Failed to process refund');
    }
  };

  const formatAmount = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          Payment Management
        </h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-[#84AE92]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#84AE92]/50"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          
          <input
            type="text"
            placeholder="User ID..."
            value={filters.userId}
            onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
            className="px-3 py-2 border border-[#84AE92]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#84AE92]/50"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#84AE92]/20">
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">User</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Amount</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Plan</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Status</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Date</th>
              <th className="text-left py-3 px-4 font-medium text-[#5A827E]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment._id} className="border-b border-[#84AE92]/10 hover:bg-[#FAFFCA]/30">
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-[#5A827E]">{payment.userId?.name || 'Unknown'}</div>
                    <div className="text-sm text-[#5A827E]/70">{payment.userId?.email || 'N/A'}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-[#5A827E]">
                    {formatAmount(payment.amount, payment.currency)}
                  </div>
                  <div className="text-sm text-[#5A827E]/70 capitalize">
                    {payment.billingCycle}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#B9D4AA]/20 text-[#5A827E] capitalize">
                    {payment.planId?.name || 'Unknown'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-[#5A827E]">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-[#5A827E]/70">
                    {new Date(payment.createdAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className="py-4 px-4">
                  {payment.status === 'completed' && (
                    <button
                      onClick={() => setRefundModal({ open: true, payment, reason: '' })}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Refund
                    </button>
                  )}
                  {payment.status === 'refunded' && payment.refundedAt && (
                    <div className="text-xs text-[#5A827E]/70">
                      Refunded: {new Date(payment.refundedAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-[#5A827E]/70">
          Showing {payments.length} of {pagination.totalPayments} payments
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

      {/* Refund Modal */}
      {refundModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Process Refund</h3>
            
            <div className="mb-4">
              <p className="text-sm text-[#5A827E]/70 mb-2">
                Refunding payment of {formatAmount(refundModal.payment.amount, refundModal.payment.currency)} 
                for {refundModal.payment.userId?.name}
              </p>
              
              <label className="block text-sm font-medium text-[#5A827E] mb-2">
                Refund Reason
              </label>
              <textarea
                value={refundModal.reason}
                onChange={(e) => setRefundModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for refund..."
                className="w-full px-3 py-2 border border-[#84AE92]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#84AE92]/50"
                rows="3"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRefundModal({ open: false, payment: null, reason: '' })}
                className="px-4 py-2 text-sm font-medium text-[#5A827E] border border-[#84AE92]/30 rounded-lg hover:bg-[#B9D4AA]/20"
              >
                Cancel
              </button>
              <button
                onClick={processRefund}
                disabled={!refundModal.reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;


