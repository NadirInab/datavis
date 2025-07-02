import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import ExportMenu from '../components/ExportMenu';
import Button, { Icons, ButtonGroup } from '../components/ui/Button';
import { ChartCard } from '../components/ui/Card';
import { ChartSkeleton, FormSkeleton } from '../components/loading/SkeletonLoader';
import LineChartComponent from '../components/charts/LineChart';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import AreaChartComponent from '../components/charts/AreaChart';
import RadarChartComponent from '../components/charts/RadarChart';
import BubbleChartComponent from '../components/charts/BubbleChart';

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

  // Add a safety check - allow visitors
  useEffect(() => {
    if (!currentUser && !isVisitor()) {
      console.log("No authenticated user or visitor found, redirecting to login");
      navigate('/signin', { state: { from: `/visualize/${fileId}` } });
    }
  }, [currentUser, navigate, fileId]);
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visualize');
  const [activeVizIndex, setActiveVizIndex] = useState(0);
  const [customViz, setCustomViz] = useState({
    type: 'bar',
    title: '',
    columns: {}
  });
  const [error, setError] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [chartLoading, setChartLoading] = useState(false);
  
  const chartTypes = [
    { id: 'bar', name: 'Bar Chart' },
    { id: 'line', name: 'Line Chart' },
    { id: 'pie', name: 'Pie Chart' },
    { id: 'area', name: 'Area Chart' },
    { id: 'radar', name: 'Radar Chart' },
    { id: 'bubble', name: 'Bubble Chart' }
  ];
  
  useEffect(() => {
    // Load file data from localStorage
    const loadFile = async () => {
      // Allow visitors to access visualizations
      if (!currentUser && !isVisitor()) return;

      setLoading(true);

      try {
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 600));

        const userId = currentUser?.id || (isVisitor() ? (localStorage.getItem('sessionId') || 'visitor-session') : 'anonymous');
        const filesData = JSON.parse(localStorage.getItem(`files_${userId}`) || '[]');
        const fileData = filesData.find(f => f.id === fileId);

        console.log('Visualize Debug:', {
          fileId,
          userId,
          filesCount: filesData.length,
          fileFound: !!fileData,
          isVisitorUser: isVisitor(),
          currentUserExists: !!currentUser
        });

        if (!fileData) {
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
      return null;
    }
    
    const currentViz = file.visualizations[activeVizIndex];
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
  
  const handleCreateVisualization = () => {
    if (!file) return;
    
    // Validate inputs
    if (!customViz.title) {
      setError('Please enter a title for your visualization');
      return;
    }
    
    if (customViz.type === 'pie' && (!customViz.columns.name || !customViz.columns.value)) {
      setError('Please select both category and value columns for pie chart');
      return;
    }
    
    if ((customViz.type === 'bar' || customViz.type === 'line' || customViz.type === 'area') && 
        (!customViz.columns.x || !customViz.columns.y)) {
      setError('Please select both X and Y columns');
      return;
    }
    
    // Add the new visualization
    const newViz = { ...customViz };
    const userId = currentUser?.id || (isVisitor() ? (localStorage.getItem('sessionId') || 'visitor-session') : 'anonymous');
    const filesData = JSON.parse(localStorage.getItem(`files_${userId}`) || '[]');
    const fileIndex = filesData.findIndex(f => f.id === fileId);
    
    if (fileIndex === -1) {
      setError('File not found');
      return;
    }
    
    const updatedFile = { 
      ...filesData[fileIndex],
      visualizations: [...(filesData[fileIndex].visualizations || []), newViz]
    };
    
    filesData[fileIndex] = updatedFile;
    localStorage.setItem(`files_${userId}`, JSON.stringify(filesData));
    
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
  };

  const handleExportStart = (type) => {
    setExportMessage(`Preparing ${type.toUpperCase()} export...`);
  };

  const handleExportComplete = (type) => {
    setExportMessage(`${type.toUpperCase()} export completed successfully!`);
    setTimeout(() => setExportMessage(''), 3000);
  };

  const handleExportError = (error) => {
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{file.name}</h1>
          <p className="mt-2 text-gray-600">
            {file.rows?.toLocaleString() || 'N/A'} rows • {file.columns || 'N/A'} columns •
            {file.visualizations?.length || 0} visualizations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate('/app/files')}
            variant="outline"
            icon={Icons.ArrowLeft}
          >
            Back to Files
          </Button>
          <ExportMenu
            file={file}
            onExportStart={handleExportStart}
            onExportComplete={handleExportComplete}
            onExportError={handleExportError}
          />
        </div>
      </div>
      
      <ChartCard className="overflow-hidden">
        <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <ButtonGroup className="w-full">
            <Button
              onClick={() => setActiveTab('visualize')}
              variant={activeTab === 'visualize' ? 'primary' : 'ghost'}
              className="flex-1 rounded-none border-0"
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
            <h2 className="text-lg font-medium text-gray-900 mb-6">Create New Visualization</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label htmlFor="vizType" className="block text-sm font-medium text-gray-700">
                  Chart Type
                </label>
                <select
                  id="vizType"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={customViz.type}
                  onChange={e => setCustomViz({ ...customViz, type: e.target.value, columns: {} })}
                >
                  {chartTypes.map(chart => (
                    <option key={chart.id} value={chart.id}>
                      {chart.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="vizTitle" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="vizTitle"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={customViz.title}
                  onChange={e => setCustomViz({ ...customViz, title: e.target.value })}
                />
              </div>
              
              {/* Chart-specific options */}
              {customViz.type === 'pie' && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="categoryCol" className="block text-sm font-medium text-gray-700">
                      Category Column
                    </label>
                    <select
                      id="categoryCol"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={customViz.columns.name || ''}
                      onChange={e => setCustomViz({
                        ...customViz,
                        columns: { ...customViz.columns, name: e.target.value }
                      })}
                    >
                      <option value="">Select column</option>
                      {columnOptions.category.map(col => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="valueCol" className="block text-sm font-medium text-gray-700">
                      Value Column
                    </label>
                    <select
                      id="valueCol"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={customViz.columns.value || ''}
                      onChange={e => setCustomViz({
                        ...customViz,
                        columns: { ...customViz.columns, value: e.target.value }
                      })}
                    >
                      <option value="">Select column</option>
                      <option value="count">Count (frequency)</option>
                      {columnOptions.numeric.map(col => (
                        <option key={col} value={col}>
                          {col} (sum)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {(customViz.type === 'bar' || customViz.type === 'line' || customViz.type === 'area') && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="xCol" className="block text-sm font-medium text-gray-700">
                      X-Axis Column
                    </label>
                    <select
                      id="xCol"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={customViz.columns.x || ''}
                      onChange={e => setCustomViz({
                        ...customViz,
                        columns: { ...customViz.columns, x: e.target.value }
                      })}
                    >
                      <option value="">Select column</option>
                      {[...columnOptions.category, ...columnOptions.date].map(col => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="yCol" className="block text-sm font-medium text-gray-700">
                      Y-Axis Column
                    </label>
                    <select
                      id="yCol"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={customViz.columns.y || ''}
                      onChange={e => setCustomViz({
                        ...customViz,
                        columns: { ...customViz.columns, y: e.target.value }
                      })}
                    >
                      <option value="">Select column</option>
                      {columnOptions.numeric.map(col => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateVisualization}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Visualization
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'data' && (
          <div className="p-6 overflow-x-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Data Preview</h2>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {file.data && file.data.length > 0 && Object.keys(file.data[0]).map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                      {file.columnTypes && (
                        <span className="ml-1 text-xxs font-normal text-gray-400">
                          ({file.columnTypes[header]})
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {file.data && file.data.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.values(row).map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {String(cell ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {file.data && file.data.length > 100 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing first 100 rows of {file.rows} total rows
              </div>
            )}
          </div>
        )}
      </ChartCard>
    </div>
  );
};

export default Visualize;

