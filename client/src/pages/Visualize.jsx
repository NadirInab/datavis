import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { fileAPI, userAPI } from '../services/api';
import fileService from '../services/fileService';
import { useCollaboration } from '../hooks/useCollaboration';
import CollaborationPanel from '../components/collaboration/CollaborationPanel';
import { CursorManager } from '../components/collaboration/CollaborativeCursor';
import AnnotationSystem from '../components/collaboration/AnnotationSystem';
import ConnectionStatus from '../components/collaboration/ConnectionStatus';
import ShareButton from '../components/sharing/ShareButton';
import ExportMenu from '../components/ExportMenu';
import Button, { Icons, ButtonGroup } from '../components/ui/Button';
import { ChartCard } from '../components/ui/Card';
import { ChartSkeleton, FormSkeleton } from '../components/loading/SkeletonLoader';
import VisualizationCreator from '../components/visualization/VisualizationCreator';
import LineChartComponent from '../components/charts/LineChart';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import AreaChartComponent from '../components/charts/AreaChart';
import RadarChartComponent from '../components/charts/RadarChart';
import BubbleChartComponent from '../components/charts/BubbleChart';
import GeospatialVisualization from '../components/geospatial/GeospatialVisualization';
import { setupTestEnvironment, debugVisualizationData, testExportFunctionality } from '../utils/visualizationTestUtils';
import { DataPreviewErrorBoundary, TableErrorBoundary } from '../components/ErrorBoundary';
import DataSummaryCards from '../components/DataSummaryCards';

const Visualize = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  // Add try/catch for auth context
  let currentUser = null;
  let isVisitor = () => false;
  try {
    const auth = useAuth();
    currentUser = auth?.currentUser;
    isVisitor = auth?.isVisitor || (() => false);
  } catch (error) {
    console.error("Auth context error:", error);
    // Continue with null currentUser
  }

  // Remove the redirect logic - let ProtectedRoute handle authentication
  // Visitors should be able to access visualization features
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights'); // Default to insights tab to showcase the feature
  const [activeVizIndex, setActiveVizIndex] = useState(0);
  const [customViz, setCustomViz] = useState({
    type: 'bar',
    title: '',
    columns: {}
  });
  const [error, setError] = useState('');
  const [exportMessage, setExportMessage] = useState('');

  // Collaboration state
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showVoiceComments, setShowVoiceComments] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Initialize collaboration (with error boundary)
  const collaboration = useCollaboration(fileId) || {
    isConnected: false,
    collaborators: [],
    annotations: [],
    voiceComments: [],
    cursors: new Map(),
    followMode: null,
    isFollowing: false,
    sendCursorMove: () => {},
    sendChartInteraction: () => {},
    addAnnotation: () => {},
    removeAnnotation: () => {},
    addVoiceComment: () => {},
    startFollowMode: () => {},
    stopFollowMode: () => {}
  };

  // Mouse tracking for collaboration
  useEffect(() => {
    const handleMouseMove = (e) => {
      const newPosition = { x: e.clientX, y: e.clientY };
      setMousePosition(newPosition);

      // Send cursor position to other users
      if (collaboration.isConnected) {
        collaboration.sendCursorMove(newPosition.x, newPosition.y, activeVizIndex);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [collaboration.isConnected, collaboration.sendCursorMove, activeVizIndex]);

  // Collaboration handlers
  const handleToggleAnnotations = () => {
    setShowAnnotations(!showAnnotations);
  };

  const handleToggleVoiceComments = () => {
    setShowVoiceComments(!showVoiceComments);
  };

  const handleStartFollowMode = (leaderId) => {
    collaboration.startFollowMode(leaderId);
  };

  const handleStopFollowMode = () => {
    collaboration.stopFollowMode();
  };

  // Share handler
  const handleCreateShare = async (fileId, settings) => {
    try {
      console.log('🔐 Creating share link for file:', fileId);
      console.log('👤 Current user:', currentUser);

      // Check if user is authenticated
      if (!currentUser) {
        throw new Error('Please sign in to create share links');
      }

      // Get Firebase ID token with multiple fallback methods
      let idToken = '';
      try {
        if (currentUser.getIdToken && typeof currentUser.getIdToken === 'function') {
          idToken = await currentUser.getIdToken(true); // Force refresh
          console.log('✅ Got ID token via getIdToken()');
        } else if (currentUser.accessToken) {
          idToken = currentUser.accessToken;
          console.log('✅ Using accessToken');
        } else if (currentUser.uid) {
          // For development/testing - create a mock token
          idToken = `mock-token-${currentUser.uid}`;
          console.log('⚠️ Using mock token for development');
        } else {
          throw new Error('Unable to get authentication token');
        }
      } catch (tokenError) {
        console.error('❌ Token retrieval failed:', tokenError);
        throw new Error('Authentication failed. Please sign in again.');
      }

      console.log('🌐 Making API request to create share link...');
      const response = await fetch(`/api/v1/sharing/${fileId}/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create share link');
      }

      console.log('✅ Share link created successfully:', data.shareInfo.shareUrl);

      // Update file state with sharing info
      setFile(prev => ({
        ...prev,
        sharing: {
          isShared: true,
          shareUrl: data.shareInfo.shareUrl,
          shareToken: data.shareInfo.shareToken,
          permissions: data.shareInfo.permissions
        }
      }));

      return {
        success: true,
        shareInfo: data.shareInfo
      };
    } catch (error) {
      console.error('❌ Error creating share link:', error);
      throw error;
    }
  };
  const [chartLoading, setChartLoading] = useState(false);
  
  const chartTypes = [
    { id: 'bar', name: 'Bar Chart' },
    { id: 'line', name: 'Line Chart' },
    { id: 'pie', name: 'Pie Chart' },
    { id: 'area', name: 'Area Chart' },
    { id: 'radar', name: 'Radar Chart' },
    { id: 'bubble', name: 'Bubble Chart' },
    { id: 'geospatial', name: 'Map Visualization' }
  ];
  
  useEffect(() => {
    // Load file data from API
    const loadFile = async () => {
      // Allow visitors to access visualizations
      if (!currentUser && !isVisitor()) return;

      setLoading(true);

      try {
        let fileData = null;

        // Use the unified file service for smart file loading
        try {
          console.log('🔄 Loading file using unified file service...');
          const result = await fileService.getFile(fileId, currentUser, isVisitor);
          fileData = result.file;

          console.log('📊 File loaded successfully:', {
            source: result.source,
            hasFile: !!fileData,
            fileName: fileData?.name,
            visualizations: fileData?.visualizations?.length || 0
          });
        } catch (serviceError) {
          console.error('File service error:', serviceError);
          // Final fallback to direct localStorage access
          const userId = currentUser?.id || (isVisitor() ? (localStorage.getItem('sessionId') || 'visitor-session') : 'anonymous');
          const filesData = JSON.parse(localStorage.getItem(`files_${userId}`) || '[]');
          fileData = filesData.find(f => f.id === fileId || f._id === fileId);
        }

        console.log('Visualize Debug:', {
          fileId,
          fileFound: !!fileData,
          isVisitorUser: isVisitor(),
          currentUserExists: !!currentUser,
          fileDataSource: fileData ? 'API or localStorage' : 'none'
        });

        if (!fileData) {
          console.warn(`File not found for ID: ${fileId}. Setting up test environment...`);

          // For development/testing, create test data if file not found
          if (fileId === '1751492985358' || import.meta.env.DEV) {
            const testFile = setupTestEnvironment();
            setFile(testFile);
            if (testFile.visualizations && testFile.visualizations.length > 0) {
              setActiveVizIndex(0);
            }
            return;
          }

          setError(`File not found (ID: ${fileId}). Please upload a file first or check the file ID.`);
          return;
        }

        setFile(fileData);

        // Set initial visualization if available
        if (fileData.visualizations && fileData.visualizations.length > 0) {
          setActiveVizIndex(0);
        }
      } catch (error) {
        console.error('Error loading file:', error);
        setError('Error loading file data');
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [fileId, currentUser, isVisitor]);
  
  // Get column options based on their data types
  const columnOptions = useMemo(() => {
    if (!file || !file.columnTypes) return { numeric: [], category: [], date: [] };
    
    const numeric = [];
    const category = [];
    const date = [];
    
    Object.entries(file.columnTypes).forEach(([column, type]) => {
      if (type === 'numeric') {
        numeric.push(column);
      } else if (type === 'date') {
        date.push(column);
      } else if (type !== 'null') {
        category.push(column);
      }
    });
    
    return { numeric, category, date };
  }, [file]);
  
  // Prepare data for the current visualization
  const vizData = useMemo(() => {
    if (!file || !file.data || !file.visualizations || file.visualizations.length === 0) {
      console.log('vizData: Missing required data', { file: !!file, data: !!file?.data, visualizations: !!file?.visualizations });
      return null;
    }

    if (activeVizIndex >= file.visualizations.length) {
      console.error('vizData: Invalid visualization index', activeVizIndex, 'Max:', file.visualizations.length - 1);
      return null;
    }

    const currentViz = file.visualizations[activeVizIndex];
    console.log('vizData: Processing visualization', currentViz);

    const data = [...file.data];
    
    if (currentViz.type === 'pie') {
      // For pie charts, we need to aggregate the data
      const { name, value } = currentViz.columns;
      
      // If value is 'count', we just count occurrences
      if (value === 'count') {
        const counts = {};
        data.forEach(row => {
          const category = row[name];
          counts[category] = (counts[category] || 0) + 1;
        });
        
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      }
      
      // Otherwise, sum the values for each category
      const sums = {};
      data.forEach(row => {
        const category = row[name];
        const val = parseFloat(row[value]) || 0;
        sums[category] = (sums[category] || 0) + val;
      });
      
      return Object.entries(sums).map(([name, value]) => ({ name, value }));
    }
    
    if (currentViz.type === 'bar' || currentViz.type === 'line' || currentViz.type === 'area') {
      const { x, y } = currentViz.columns;
      
      // For single y-axis
      if (typeof y === 'string') {
        // Group by x-axis and calculate average y value
        const grouped = {};
        const counts = {};
        
        data.forEach(row => {
          const xValue = row[x];
          const yValue = parseFloat(row[y]) || 0;
          
          if (!grouped[xValue]) {
            grouped[xValue] = 0;
            counts[xValue] = 0;
          }
          
          grouped[xValue] += yValue;
          counts[xValue]++;
        });
        
        // Calculate averages and format data for charts
        return Object.entries(grouped).map(([name, value]) => ({
          name,
          value: value / counts[name]
        }));
      }
      
      // For multiple y-axes
      if (Array.isArray(y)) {
        // Group by x-axis
        const result = {};
        
        data.forEach(row => {
          const xValue = row[x];
          
          if (!result[xValue]) {
            result[xValue] = { name: xValue };
            y.forEach(col => {
              result[xValue][col] = 0;
            });
            result[xValue].count = 0;
          }
          
          y.forEach(col => {
            result[xValue][col] += parseFloat(row[col]) || 0;
          });
          
          result[xValue].count++;
        });
        
        // Calculate averages
        const formattedData = Object.values(result).map(item => {
          const { count, ...rest } = item;
          y.forEach(col => {
            rest[col] = rest[col] / count;
          });
          return rest;
        });
        
        return formattedData;
      }
    }
    
    return data;
  }, [file, activeVizIndex]);
  
  const handleCreateVisualization = async (vizData) => {
    if (!file) return;

    setChartLoading(true);
    setError('');

    try {
      // For registered users, try to save to database first
      if (currentUser && !isVisitor()) {
        try {
          console.log('🔄 Saving visualization to database for registered user...');
          const response = await fileAPI.createVisualization(fileId, vizData);

          if (response.success) {
            console.log('✅ Visualization saved to database successfully');

            // Update local state with the response from database
            const updatedFile = {
              ...file,
              visualizations: [...(file.visualizations || []), response.visualization]
            };

            setFile(updatedFile);
            setActiveVizIndex(updatedFile.visualizations.length - 1);
            setActiveTab('visualize');
            setError('');

            // Reset custom viz form
            setCustomViz({
              type: 'bar',
              title: '',
              columns: {}
            });

            return; // Success - exit early
          }
        } catch (apiError) {
          console.warn('⚠️ Database save failed, falling back to localStorage:', apiError);
          // Fall through to localStorage backup
        }
      }

      // Fallback to localStorage using file service
      console.log('💾 Saving visualization using file service...');
      const newViz = {
        ...vizData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      // Update file with new visualization
      const updatedFile = {
        ...file,
        visualizations: [...(file.visualizations || []), newViz]
      };

      // Use file service to update the file
      try {
        await fileService.updateFile(fileId, { visualizations: updatedFile.visualizations }, currentUser, isVisitor);

        // Update local state
        setFile(updatedFile);
        setActiveVizIndex(updatedFile.visualizations.length - 1);
        setActiveTab('visualize');
        setError('');

        // Reset custom viz form
        setCustomViz({
          type: 'bar',
          title: '',
          columns: {}
        });

        console.log('✅ Visualization saved successfully using file service');
      } catch (updateError) {
        console.error('Failed to update file with new visualization:', updateError);
        setError('Failed to save visualization. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating visualization:', error);
      setError('Failed to create visualization. Please try again.');
    } finally {
      setChartLoading(false);
    }
  };

  const handleExportStart = (type) => {
    console.log(`Starting export: ${type}`);
    setExportMessage(`Preparing ${type.toUpperCase()} export...`);

    // Debug export functionality
    if (type === 'png' || type === 'pdf') {
      const chartElement = document.getElementById(`chart-${activeVizIndex}`);
      console.log('Chart element for export:', chartElement);
      if (!chartElement) {
        console.error('Chart element not found for export');
        setExportMessage('Error: Chart element not found');
        return;
      }
    }

    if ((type === 'csv' || type === 'json') && (!file || !file.data)) {
      console.error('No data available for export');
      setExportMessage('Error: No data available for export');
      return;
    }
  };

  const handleExportComplete = (type) => {
    console.log(`Export completed: ${type}`);
    setExportMessage(`${type.toUpperCase()} export completed successfully!`);
    setTimeout(() => setExportMessage(''), 3000);
  };

  const handleExportError = (error) => {
    console.error('Export error:', error);
    setExportMessage(`Export failed: ${error}`);
    setTimeout(() => setExportMessage(''), 5000);
  };

  // Render the current chart based on type
  const renderChart = () => {
    if (!file || !file.visualizations || file.visualizations.length === 0 || !vizData) {
      return <div className="text-center py-10 text-gray-500">No visualization available</div>;
    }
    
    const viz = file.visualizations[activeVizIndex];
    
    switch (viz.type) {
      case 'bar':
        return (
          <div className="h-96">
            <BarChartComponent data={vizData} dataKey="value" nameKey="name" />
          </div>
        );
      case 'line':
        return (
          <div className="h-96">
            <LineChartComponent data={vizData} dataKey="value" nameKey="name" />
          </div>
        );
      case 'pie':
        return (
          <div className="h-96">
            <PieChartComponent data={vizData} dataKey="value" nameKey="name" />
          </div>
        );
      case 'area':
        return (
          <div className="h-96">
            <AreaChartComponent data={vizData} />
          </div>
        );
      case 'radar':
        return (
          <div className="h-96">
            <RadarChartComponent data={vizData} />
          </div>
        );
      case 'bubble':
        return (
          <div className="h-96">
            <BubbleChartComponent data={vizData} />
          </div>
        );
      case 'geospatial':
        return (
          <div className="min-h-96">
            <GeospatialVisualization
              data={file.data}
              columns={file.columns}
              title={viz.title || 'Geographic Visualization'}
              onExport={handleExportComplete}
            />
          </div>
        );
      default:
        return <div className="text-center py-10 text-gray-500">Unsupported chart type</div>;
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <div className="space-y-6">
            <FormSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6">
          <Icons.X className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button
          onClick={() => navigate('/app/files')}
          variant="primary"
          icon={Icons.ArrowLeft}
        >
          Back to Files
        </Button>
      </div>
    );
  }

  if (!file) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Collaboration Components */}
      {currentUser && !isVisitor() && (
        <>
          <CollaborationPanel
            collaborators={collaboration.collaborators}
            isConnected={collaboration.isConnected}
            annotations={collaboration.annotations}
            voiceComments={collaboration.voiceComments}
            followMode={collaboration.followMode}
            isFollowing={collaboration.isFollowing}
            onStartFollowMode={handleStartFollowMode}
            onStopFollowMode={handleStopFollowMode}
            onToggleAnnotations={handleToggleAnnotations}
            onToggleVoiceComments={handleToggleVoiceComments}
            showAnnotations={showAnnotations}
            showVoiceComments={showVoiceComments}
          />

          <CursorManager
            cursors={collaboration.cursors}
            collaborators={collaboration.collaborators}
          />
        </>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{file.name}</h1>
          <p className="mt-2 text-gray-600">
            {file.rows?.toLocaleString() || 'N/A'} rows • {file.columnCount || file.columns?.length || 'N/A'} columns •
            {file.visualizations?.length || 0} visualizations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate('/app/files')}
            variant="outline"
            icon={Icons.ArrowLeft}
            size="sm"
          >
            Back to Files
          </Button>

          {/* Enhanced Share Button - Only for file owners */}
          {currentUser && !isVisitor() && (
            <div className="relative">
              <ShareButton
                fileId={fileId}
                fileName={file.name}
                onShare={handleCreateShare}
                isShared={file.sharing?.isShared}
                shareUrl={file.sharing?.shareUrl}
                className="shadow-lg"
              />
              {/* Development indicator */}
              {import.meta.env.DEV && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                     title="Share feature available" />
              )}
            </div>
          )}

          <ExportMenu
            file={file}
            onExportStart={handleExportStart}
            onExportComplete={handleExportComplete}
            onExportError={handleExportError}
          />

          {/* Connection Status - Only show for authenticated users */}
          {currentUser && !isVisitor() && (
            <ConnectionStatus
              isConnected={collaboration.isConnected}
              collaborators={collaboration.collaborators}
              onRetry={() => window.location.reload()}
            />
          )}
        </div>
      </div>
      
      <ChartCard className="overflow-hidden relative">
        {/* Annotation System Overlay */}
        {currentUser && !isVisitor() && activeTab === 'visualize' && (
          <AnnotationSystem
            chartId={`chart-${activeVizIndex}`}
            annotations={collaboration.annotations}
            onAddAnnotation={collaboration.addAnnotation}
            onRemoveAnnotation={collaboration.removeAnnotation}
            onEditAnnotation={(id, text) => {
              // Handle annotation editing if needed
              console.log('Edit annotation:', id, text);
            }}
            currentUserId={currentUser.uid || currentUser.id}
            isVisible={showAnnotations}
          />
        )}

        <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <ButtonGroup className="w-full">
            <Button
              onClick={() => setActiveTab('insights')}
              variant={activeTab === 'insights' ? 'primary' : 'ghost'}
              className="flex-1 rounded-none border-0"
            >
              <Icons.BarChart className="w-4 h-4 mr-2" />
              Data Insights
            </Button>
            <Button
              onClick={() => setActiveTab('visualize')}
              variant={activeTab === 'visualize' ? 'primary' : 'ghost'}
              className="flex-1 rounded-none border-0 border-l border-gray-200"
            >
              <Icons.Chart className="w-4 h-4 mr-2" />
              Visualizations
            </Button>
            <Button
              onClick={() => setActiveTab('create')}
              variant={activeTab === 'create' ? 'primary' : 'ghost'}
              className="flex-1 rounded-none border-0 border-l border-gray-200"
            >
              <Icons.Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
            <Button
              onClick={() => setActiveTab('data')}
              variant={activeTab === 'data' ? 'primary' : 'ghost'}
              className="flex-1 rounded-none border-0 border-l border-gray-200"
            >
              <Icons.Table className="w-4 h-4 mr-2" />
              Data Preview
            </Button>
          </ButtonGroup>
        </div>
        
        {activeTab === 'insights' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Auto-Generated Data Summary</h2>
              <p className="text-gray-600">
                Smart analysis of your data including quality metrics, column insights, suggested visualizations, and anomaly detection.
              </p>
            </div>
            {file.data && file.data.length > 0 ? (
              <DataSummaryCards data={file.data} />
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icons.BarChart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-600">Unable to generate insights without data.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'visualize' && (
          <div className="p-6">
            {file.visualizations && file.visualizations.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 mb-6">
                  {file.visualizations.map((viz, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveVizIndex(index)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        activeVizIndex === index
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {viz.title}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {file.visualizations[activeVizIndex].title}
                  </h2>
                  <div className="flex items-center space-x-3">
                    {exportMessage && (
                      <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-md">
                        {exportMessage}
                      </div>
                    )}
                    <ExportMenu
                      data={file.data}
                      visualization={file.visualizations[activeVizIndex]}
                      chartElementId={`chart-${activeVizIndex}`}
                      filename={file.name.replace('.csv', '')}
                      onExportStart={handleExportStart}
                      onExportComplete={handleExportComplete}
                      onExportError={handleExportError}
                    />
                  </div>
                </div>

                <div id={`chart-${activeVizIndex}`}>
                  {renderChart()}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-gray-900">No visualizations yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first visualization using the "Create New" tab.
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'create' && (
          <div className="p-6">
            <VisualizationCreator
              file={file}
              onCreateVisualization={handleCreateVisualization}
              onCancel={() => setActiveTab('visualize')}
              loading={chartLoading}
            />
          </div>
        )}
        
        {activeTab === 'data' && (
          <DataPreviewErrorBoundary>
            <div className="p-6 overflow-x-auto">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Data Preview</h2>

              {(() => {
                try {
                  // Validate file and data structure
                  if (!file || !file.data || !Array.isArray(file.data) || file.data.length === 0) {
                    return (
                      <div className="text-center py-10">
                        <div className="text-gray-500">
                          <Icons.Table className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                          <p>Unable to load file data for preview.</p>
                        </div>
                      </div>
                    );
                  }

                  return null; // Continue with normal rendering
                } catch (error) {
                  console.error('Error in Data Preview validation:', error);
                  return (
                    <div className="text-center py-10">
                      <div className="text-gray-500">
                        <Icons.AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Error</h3>
                        <p>An error occurred while loading the data preview.</p>
                        <p className="text-sm mt-2 text-gray-400">Error: {error.message}</p>
                      </div>
                    </div>
                  );
                }
              })()}

              {file && file.data && Array.isArray(file.data) && file.data.length > 0 && (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {Math.min(100, file.data.length)} of {file.data.length} rows
                  </div>
                  
                  <TableErrorBoundary>
                    <table className="min-w-full divide-y divide-gray-200">
                      {/* Table header and body */}
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(file.data[0]).map((column) => (
                            <th
                              key={column}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {file.data.slice(0, 100).map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.values(row).map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableErrorBoundary>

                  {file.data.length > 100 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Showing first 100 rows of {file.rows || file.data.length} total rows
                    </div>
                  )}
                </>
              )}
            </div>
          </DataPreviewErrorBoundary>
        )}
      </ChartCard>
    </div>
  );
};

export default Visualize;