import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { userAPI, fileAPI } from '../services/api';
import Button, { Icons } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { TableSkeleton } from '../components/loading/SkeletonLoader';

const FileManager = () => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [filterType, setFilterType] = useState('all'); // 'all', 'recent', 'large', 'small'
  const navigate = useNavigate();

  useEffect(() => {
    loadFiles();
  }, [currentUser]);

  const loadFiles = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Get files from API
      const response = await userAPI.getFiles();
      if (response.success && response.data && Array.isArray(response.data.files)) {
        setFiles(response.data.files);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      try {
        await fileAPI.deleteFile(fileId);
        // Remove file from local state
        setFiles(prevFiles => prevFiles.filter(file => file._id !== fileId && file.id !== fileId));
        setSelectedFiles(selectedFiles.filter(id => id !== fileId));
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
      }
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} selected files? This action cannot be undone.`)) {
      try {
        // Delete files one by one (could be optimized with batch delete API)
        for (const fileId of selectedFiles) {
          await fileAPI.deleteFile(fileId);
        }
        // Remove files from local state
        setFiles(prevFiles => prevFiles.filter(file => !selectedFiles.includes(file._id) && !selectedFiles.includes(file.id)));
        setSelectedFiles([]);
      } catch (error) {
        console.error('Error deleting files:', error);
        alert('Failed to delete some files. Please try again.');
        // Reload files to get current state
        loadFiles();
      }
    }
  };

  const handleVisualize = (fileId) => {
    navigate(`/app/visualize/${fileId}`);
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(file => file.id));
    }
  };

  const exportFileData = (file, format = 'json') => {
    try {
      if (format === 'json') {
        const dataStr = JSON.stringify(file.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name.replace('.csv', '')}_data.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Convert back to CSV format
        if (!file.data || file.data.length === 0) return;

        const headers = Object.keys(file.data[0]);
        const csvContent = [
          headers.join(','),
          ...file.data.map(row =>
            headers.map(header => {
              const value = row[header];
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ].join('\n');

        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name}`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const duplicateFile = (file) => {
    const newFile = {
      ...file,
      id: Date.now().toString(),
      name: `Copy of ${file.name}`,
      uploadedAt: new Date().toISOString()
    };
    
    const updatedFiles = [...files, newFile];
    localStorage.setItem(`files_${currentUser.id}`, JSON.stringify(updatedFiles));
    setFiles(updatedFiles);
  };

  // Filter files based on search query and filter type
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filterType) {
      case 'recent':
        const isRecent = new Date(file.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && isRecent;
      case 'large':
        return matchesSearch && file.size > 1024 * 1024; // > 1MB
      case 'small':
        return matchesSearch && file.size <= 1024 * 1024; // <= 1MB
      default:
        return matchesSearch;
    }
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'size-asc':
        return a.size - b.size;
      case 'size-desc':
        return b.size - a.size;
      case 'date-asc':
        return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      case 'date-desc':
      default:
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    }
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
          <p className="mt-2 text-gray-600">Manage your CSV files and visualizations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={Icons.Filter}
            onClick={() => setFilterType(filterType === 'all' ? 'recent' : 'all')}
          >
            Filter
          </Button>
          <Button
            as={Link}
            to="/app/upload"
            variant="primary"
            icon={Icons.Upload}
          >
            Upload New File
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icons.Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-xl transition-colors duration-200"
            >
              <option value="all">All Files</option>
              <option value="recent">Recent (7 days)</option>
              <option value="large">Large Files (&gt;1MB)</option>
              <option value="small">Small Files (≤1MB)</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-xl transition-colors duration-200"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>

          {/* View Mode and Bulk Actions */}
          <div className="flex items-center space-x-4">
            {selectedFiles.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                  {selectedFiles.length} selected
                </span>
                <Button
                  onClick={deleteSelectedFiles}
                  variant="danger"
                  size="sm"
                  icon={Icons.Trash}
                >
                  Delete Selected
                </Button>
              </div>
            )}

            <div className="flex rounded-xl shadow-sm border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* File Count */}
      <div className="text-sm text-gray-500">
        Showing {sortedFiles.length} of {files.length} files
      </div>

      {/* Files Display */}
      {sortedFiles.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mb-6">
            <Icons.Upload className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search or filter criteria to find your files.'
              : 'Get started by uploading your first CSV file to create beautiful visualizations.'
            }
          </p>
          {!searchQuery && (
            <Button
              as={Link}
              to="/app/upload"
              variant="primary"
              size="lg"
              icon={Icons.Upload}
            >
              Upload Your First CSV File
            </Button>
          )}
        </Card>
      ) : viewMode === 'list' ? (
        // List View
        <Card className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-50 to-secondary-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === sortedFiles.length && sortedFiles.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors duration-200"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rows</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Uploaded</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedFiles.map((file) => (
                <tr key={file.id} className="hover:bg-primary-25 transition-colors duration-200 group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleFileSelect(file.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors duration-200"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 group-hover:scale-105 transition-transform duration-200">
                        <Icons.Upload className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">{file.name}</div>
                        <div className="text-sm text-gray-500">{file.columnCount || file.columns?.length || 0} columns</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.rows?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(file.uploadedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        onClick={() => handleVisualize(file.id)}
                        variant="ghost"
                        size="sm"
                        icon={Icons.Eye}
                        className="text-primary-600 hover:text-primary-700"
                      />
                      <Button
                        onClick={() => exportFileData(file, 'json')}
                        variant="ghost"
                        size="sm"
                        icon={Icons.Download}
                        className="text-secondary-600 hover:text-secondary-700"
                        title="Export as JSON"
                      />
                      <Button
                        onClick={() => duplicateFile(file)}
                        variant="ghost"
                        size="sm"
                        icon={Icons.Copy}
                        className="text-accent-600 hover:text-accent-700"
                        title="Duplicate"
                      />
                      <Button
                        onClick={() => deleteFile(file.id)}
                        variant="ghost"
                        size="sm"
                        icon={Icons.Trash}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedFiles.map((file) => (
            <Card key={file.id} hover className="group">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Icons.Upload className="w-6 h-6 text-primary-600" />
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => handleFileSelect(file.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 truncate group-hover:text-primary-700 transition-colors duration-200">
                  {file.name}
                </h3>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rows:</span>
                    <span>{file.rows?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => handleVisualize(file.id)}
                    variant="primary"
                    size="sm"
                    icon={Icons.Eye}
                  >
                    View
                  </Button>
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => exportFileData(file, 'json')}
                      variant="ghost"
                      size="sm"
                      icon={Icons.Download}
                      className="text-secondary-600 hover:text-secondary-700"
                    />
                    <Button
                      onClick={() => duplicateFile(file)}
                      variant="ghost"
                      size="sm"
                      icon={Icons.Copy}
                      className="text-accent-600 hover:text-accent-700"
                    />
                    <Button
                      onClick={() => deleteFile(file.id)}
                      variant="ghost"
                      size="sm"
                      icon={Icons.Trash}
                      className="text-red-600 hover:text-red-700"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileManager;
