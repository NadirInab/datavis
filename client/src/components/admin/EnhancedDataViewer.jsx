import React, { useState, useEffect } from 'react';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const EnhancedDataViewer = ({ collection, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [sortField, setSortField] = useState('_id');
  const [sortOrder, setSortOrder] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort: sortField,
        order: sortOrder,
        search: searchTerm
      });

      const response = await fetch(`${API_BASE}/admin/db/data/${collection}?${params}`, {
        headers: getAuthHeaders()
      });

      const result = await response.json();
      if (result.success) {
        setData(result.data.documents);
        setPagination(prev => ({
          ...prev,
          total: result.data.total,
          pages: result.data.pages
        }));
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (error) {
      setError(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collection) {
      fetchData();
    }
  }, [collection, pagination.page, pagination.limit, sortField, sortOrder, searchTerm]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 1 ? -1 : 1);
    } else {
      setSortField(field);
      setSortOrder(-1);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }
    if (typeof value === 'boolean') {
      return <span className={value ? 'text-green-600' : 'text-red-600'}>{value.toString()}</span>;
    }
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return new Date(value).toLocaleString();
      }
      return <span className="text-blue-600">{JSON.stringify(value, null, 2)}</span>;
    }
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 50)}...
        </span>
      );
    }
    return value.toString();
  };

  const getColumns = () => {
    if (data.length === 0) return [];
    const allKeys = new Set();
    data.forEach(record => {
      Object.keys(record).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys);
  };

  const RecordModal = ({ record, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#5A827E]">Record Details</h3>
            <Button
              onClick={onClose}
              variant="ghost"
              icon={Icons.X}
              className="text-[#5A827E]/60 hover:text-[#5A827E]"
            />
          </div>
          <div className="overflow-auto max-h-[70vh]">
            <pre className="bg-[#FAFFCA]/30 p-4 rounded-lg text-sm text-[#5A827E] whitespace-pre-wrap">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );

  if (!collection) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <Card className="max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[#5A827E] flex items-center space-x-2">
                <Icons.Database className="w-5 h-5" />
                <span>{collection} Collection</span>
              </h2>
              <p className="text-[#5A827E]/70 mt-1">
                {pagination.total} records • Page {pagination.page} of {pagination.pages}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              icon={Icons.X}
              className="text-[#5A827E]/60 hover:text-[#5A827E]"
            >
              Close
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4 space-x-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5A827E]/60" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-[#84AE92]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92]"
                />
              </div>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-[#84AE92]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92]"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <Button
              onClick={fetchData}
              disabled={loading}
              icon={loading ? Icons.Loader : Icons.ArrowRight}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-center space-x-2">
                <Icons.AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="overflow-auto max-h-[60vh] border border-[#84AE92]/20 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Icons.Loader className="w-8 h-8 animate-spin text-[#84AE92]" />
              </div>
            ) : data.length > 0 ? (
              <table className="w-full">
                <thead className="bg-[#B9D4AA]/20 sticky top-0">
                  <tr>
                    {getColumns().map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-sm font-medium text-[#5A827E] cursor-pointer hover:bg-[#B9D4AA]/30"
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column}</span>
                          {sortField === column && (
                            <Icons.ArrowUp className={`w-3 h-3 transition-transform ${
                              sortOrder === 1 ? 'rotate-180' : ''
                            }`} />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5A827E]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((record, index) => (
                    <tr
                      key={record._id || index}
                      className="border-t border-[#84AE92]/10 hover:bg-[#FAFFCA]/30"
                    >
                      {getColumns().map((column) => (
                        <td key={column} className="px-4 py-3 text-sm text-[#5A827E]">
                          {formatValue(record[column])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm">
                        <Button
                          onClick={() => setSelectedRecord(record)}
                          variant="ghost"
                          size="sm"
                          icon={Icons.Eye}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-[#5A827E]/60">
                <Icons.Database className="w-12 h-12 mx-auto mb-3 text-[#84AE92]/50" />
                <p>No records found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-[#5A827E]/70">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} records
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowLeft}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-[#5A827E]">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <RecordModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

export default EnhancedDataViewer;
