import React, { useState, useEffect } from 'react';
import InteractiveMap from './InteractiveMap';
import GeospatialColumnMapper from './GeospatialColumnMapper';
import RouteAnalysis from './RouteAnalysis';
import GeospatialStats from './GeospatialStats';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GeospatialVisualization = ({ 
  data = [], 
  columns = [], 
  title = "Geospatial Analysis",
  onExport,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('map');
  const [columnMapping, setColumnMapping] = useState({});
  const [processedData, setProcessedData] = useState([]);
  const [mapSettings, setMapSettings] = useState({
    type: 'markers',
    height: '600px',
    showControls: true
  });
  const [isConfigured, setIsConfigured] = useState(false);

  const tabs = [
    { id: 'setup', name: 'Setup', icon: Icons.Settings, description: 'Configure data columns' },
    { id: 'map', name: 'Interactive Map', icon: Icons.Map, description: 'View data on map' },
    { id: 'routes', name: 'Route Analysis', icon: Icons.Route, description: 'Analyze GPS routes' },
    { id: 'stats', name: 'Statistics', icon: Icons.BarChart, description: 'Geographic insights' }
  ];

  // Handle column mapping changes
  const handleMappingChange = (mapping, preview) => {
    setColumnMapping(mapping);
    setProcessedData(preview);
    setIsConfigured(mapping.latitude && mapping.longitude);
    
    // Auto-switch to map tab when configured
    if (mapping.latitude && mapping.longitude && activeTab === 'setup') {
      setActiveTab('map');
    }
  };

  // Export functionality
  const handleExport = async (format = 'png') => {
    if (onExport) {
      const exportData = {
        type: 'geospatial',
        format,
        data: processedData,
        mapping: columnMapping,
        settings: mapSettings
      };
      await onExport(exportData);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return (
          <GeospatialColumnMapper
            columns={columns}
            data={data}
            onMappingChange={handleMappingChange}
            initialMapping={columnMapping}
          />
        );

      case 'map':
        if (!isConfigured) {
          return (
            <Card className="p-8 text-center">
              <Icons.MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Configure Geographic Columns
              </h3>
              <p className="text-gray-600 mb-4">
                Please set up your latitude and longitude columns first.
              </p>
              <Button onClick={() => setActiveTab('setup')} icon={Icons.Settings}>
                Go to Setup
              </Button>
            </Card>
          );
        }

        return (
          <div className="space-y-4">
            {/* Map Controls */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">View:</label>
                    <select
                      value={mapSettings.type}
                      onChange={(e) => setMapSettings(prev => ({ ...prev, type: e.target.value }))}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      <option value="markers">Individual Markers</option>
                      <option value="clusters">Clustered Markers</option>
                      <option value="heatmap">Heatmap</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Height:</label>
                    <select
                      value={mapSettings.height}
                      onChange={(e) => setMapSettings(prev => ({ ...prev, height: e.target.value }))}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      <option value="400px">Small (400px)</option>
                      <option value="600px">Medium (600px)</option>
                      <option value="800px">Large (800px)</option>
                      <option value="100vh">Full Screen</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleExport('png')}
                    variant="outline"
                    size="sm"
                    icon={Icons.Download}
                  >
                    Export PNG
                  </Button>
                  <Button
                    onClick={() => handleExport('pdf')}
                    variant="outline"
                    size="sm"
                    icon={Icons.FileText}
                  >
                    Export PDF
                  </Button>
                </div>
              </div>
            </Card>

            {/* Interactive Map */}
            <InteractiveMap
              data={data}
              latColumn={columnMapping.latitude}
              lngColumn={columnMapping.longitude}
              valueColumn={columnMapping.value}
              labelColumn={columnMapping.label}
              mapType={mapSettings.type}
              height={mapSettings.height}
              showControls={mapSettings.showControls}
            />
          </div>
        );

      case 'routes':
        if (!isConfigured) {
          return (
            <Card className="p-8 text-center">
              <Icons.Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Route Analysis Requires Setup
              </h3>
              <p className="text-gray-600 mb-4">
                Configure your geographic columns to analyze routes and GPS data.
              </p>
              <Button onClick={() => setActiveTab('setup')} icon={Icons.Settings}>
                Go to Setup
              </Button>
            </Card>
          );
        }

        return (
          <RouteAnalysis
            data={data}
            latColumn={columnMapping.latitude}
            lngColumn={columnMapping.longitude}
            timestampColumn={columnMapping.timestamp}
            labelColumn={columnMapping.label}
          />
        );

      case 'stats':
        if (!isConfigured) {
          return (
            <Card className="p-8 text-center">
              <Icons.BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Statistics Require Setup
              </h3>
              <p className="text-gray-600 mb-4">
                Configure your geographic columns to view spatial statistics.
              </p>
              <Button onClick={() => setActiveTab('setup')} icon={Icons.Settings}>
                Go to Setup
              </Button>
            </Card>
          );
        }

        return (
          <GeospatialStats
            data={data}
            latColumn={columnMapping.latitude}
            lngColumn={columnMapping.longitude}
            valueColumn={columnMapping.value}
            categoryColumn={columnMapping.category}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">
            Visualize and analyze geographic data with interactive maps
          </p>
        </div>
        
        {isConfigured && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Icons.MapPin className="w-4 h-4" />
            <span>{data.length} data points</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = tab.id !== 'setup' && !isConfigured;
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : isDisabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${isActive
                    ? 'text-blue-500'
                    : isDisabled
                    ? 'text-gray-400'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `} />
                {tab.name}
                {isDisabled && (
                  <Icons.Lock className="ml-1 h-3 w-3 text-gray-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Quick Stats Footer */}
      {isConfigured && (
        <Card className="p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.length}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {processedData.filter(p => p.isValid).length}
              </div>
              <div className="text-sm text-gray-600">Valid Coordinates</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{columns.length}</div>
              <div className="text-sm text-gray-600">Data Columns</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Object.values(columnMapping).filter(Boolean).length}
              </div>
              <div className="text-sm text-gray-600">Mapped Fields</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GeospatialVisualization;
