import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Eye, Edit, Users, Lock, AlertCircle, 
  FileText, Download, Home, LogIn 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../context/FirebaseAuthContext';
import { useCollaboration } from '../hooks/useCollaboration';
import CollaborationPanel from '../components/collaboration/CollaborationPanel';
import { CursorManager } from '../components/collaboration/CollaborativeCursor';

/**
 * Shared File Viewer Page
 * Displays shared files with appropriate permissions
 */
const SharedFileViewer = () => {
  const { fileId, shareToken } = useParams();
  const navigate = useNavigate();
  const { currentUser, getCurrentUserToken } = useAuth();
  
  const [file, setFile] = useState(null);
  const [permission, setPermission] = useState('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canView, setCanView] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Initialize collaboration for shared sessions
  const collaboration = useCollaboration(fileId);

  useEffect(() => {
    loadSharedFile();
  }, [fileId, shareToken, currentUser]);

  const loadSharedFile = async () => {
    try {
      setLoading(true);
      setError('');

      // Get authentication token if user is logged in
      let authHeader = '';
      if (currentUser && getCurrentUserToken) {
        try {
          const token = await getCurrentUserToken();
          if (token) {
            authHeader = `Bearer ${token}`;
          }
        } catch (tokenError) {
          console.warn('Failed to get auth token for shared file access:', tokenError);
          // Continue without auth - shared files may be accessible without authentication
        }
      }

      const response = await fetch(`/api/v1/sharing/${fileId}/${shareToken}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load shared file');
      }

      setFile(data.file);
      setPermission(data.permission);
      setCanEdit(data.canEdit);
      setCanView(data.canView);
      setIsOwner(data.isOwner);

    } catch (error) {
      console.error('Error loading shared file:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionInfo = () => {
    switch (permission) {
      case 'view':
        return {
          icon: Eye,
          label: 'View Only',
          description: 'You can view this file but cannot make changes',
          color: 'blue'
        };
      case 'edit':
        return {
          icon: Edit,
          label: 'Can Edit',
          description: 'You can view and modify this file',
          color: 'green'
        };
      case 'admin':
        return {
          icon: Users,
          label: 'Admin',
          description: 'You have full control over this file',
          color: 'purple'
        };
      default:
        return {
          icon: Lock,
          label: 'No Access',
          description: 'You do not have permission to view this file',
          color: 'red'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared file...</p>
        </div>
      </div>
    );
  }

  if (error || !canView) {
    const permissionInfo = getPermissionInfo();
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
            error ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {error ? (
              <AlertCircle className="w-8 h-8 text-red-600" />
            ) : (
              <permissionInfo.icon className={`w-8 h-8 text-${permissionInfo.color}-600`} />
            )}
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {error ? 'Access Denied' : permissionInfo.label}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {error || permissionInfo.description}
          </p>

          <div className="space-y-3">
            {!currentUser && (
              <Button
                onClick={() => navigate('/signin')}
                variant="primary"
                icon={LogIn}
                className="w-full"
              >
                Sign In for Access
              </Button>
            )}
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              icon={Home}
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const permissionInfo = getPermissionInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                icon={Home}
                size="sm"
              >
                Home
              </Button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {file?.filename || 'Shared File'}
                  </h1>
                  <p className="text-sm text-gray-500">Shared CSV File</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Permission Badge */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm bg-${permissionInfo.color}-100 text-${permissionInfo.color}-700`}>
                <permissionInfo.icon className="w-4 h-4" />
                <span>{permissionInfo.label}</span>
              </div>

              {!currentUser && (
                <Button
                  onClick={() => navigate('/signin')}
                  variant="primary"
                  icon={LogIn}
                  size="sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Collaboration Components */}
        {currentUser && (
          <>
            <CollaborationPanel
              collaborators={collaboration.collaborators}
              isConnected={collaboration.isConnected}
              annotations={collaboration.annotations}
              voiceComments={collaboration.voiceComments}
              followMode={collaboration.followMode}
              isFollowing={collaboration.isFollowing}
              onStartFollowMode={collaboration.startFollowMode}
              onStopFollowMode={collaboration.stopFollowMode}
              onToggleAnnotations={() => {}}
              onToggleVoiceComments={() => {}}
              showAnnotations={true}
              showVoiceComments={true}
            />
            
            <CursorManager 
              cursors={collaboration.cursors}
              collaborators={collaboration.collaborators}
            />
          </>
        )}

        {/* File Content */}
        <Card className="overflow-hidden">
          {/* File Info */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {file?.originalName || file?.filename}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {file?.dataInfo?.rows?.toLocaleString() || 0} rows • 
                  {file?.dataInfo?.columns || 0} columns • 
                  {file?.visualizations?.length || 0} visualizations
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {canEdit && (
                  <Button
                    variant="outline"
                    icon={Edit}
                    size="sm"
                  >
                    Edit Mode
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  icon={Download}
                  size="sm"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Data Preview */}
          <div className="p-6">
            {file?.data && file.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(file.data[0]).map((column) => (
                        <th
                          key={column}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {file.data.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {file.data.length > 10 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Showing 10 of {file.data.length.toLocaleString()} rows
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-500">This file doesn't contain any data to display.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SharedFileViewer;
