import React, { useState, useEffect } from 'react';
import { useMemo } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { hasFeatureAccess, getUserLimits, getUserTier } from '../../utils/featureGating';
import InteractiveMap from './InteractiveMap';
import GeospatialColumnMapper from './GeospatialColumnMapper';
import RouteAnalysis from './RouteAnalysis';
import GeospatialStats from './GeospatialStats';
import GeospatialUpgradePrompt from '../premium/GeospatialUpgradePrompt';
import GeospatialDebugPanel from '../debug/GeospatialDebugPanel';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GeospatialVisualization = ({
  data = [],
  columns = [],
  title = "Geospatial Analysis",
  onExport,
  className = ''
}) => {
  // Handle both old format (columns as number) and new format (columns as array)
  const columnNames = React.useMemo(() => {
    if (Array.isArray(columns)) {
      return columns;
    }
    // Fallback: extract column names from data if columns is not an array
    if (data && data.length > 0 && typeof data[0] === 'object') {
      return Object.keys(data[0]);
    }
    return [];
  }, [columns, data]);
  const [activeTab, setActiveTab] = React.useState('setup');
  const [columnMapping, setColumnMapping] = React.useState({});
  const [processedData, setProcessedData] = React.useState([]);
  const [mapSettings, setMapSettings] = React.useState({
    type: 'markers',
    height: '600px',
    showControls: true
  });

  const [isConfigured, setIsConfigured] = React.useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);

  // Premium feature access
  const { currentUser } = useAuth();
  const userTier = getUserTier(currentUser);
  const userLimits = getUserLimits(currentUser);

  // Feature access checks
  const hasInteractiveAccess = hasFeatureAccess(currentUser, 'geospatial_interactive');
  const hasClusteringAccess = hasFeatureAccess(currentUser, 'geospatial_clustering');
  const hasHeatmapAccess = hasFeatureAccess(currentUser, 'geospatial_heatmaps');
  const hasRouteAccess = hasFeatureAccess(currentUser, 'geospatial_route_analysis');

  // Reset map type to markers if premium features are not available
  React.useEffect(() => {
    if ((mapSettings.type === 'clusters' && !hasClusteringAccess) ||
        (mapSettings.type === 'heatmap' && !hasHeatmapAccess)) {
      setMapSettings(prev => ({ ...prev, type: 'markers' }));
    }
  }, [mapSettings.type, hasClusteringAccess, hasHeatmapAccess]);
  const hasExportAccess = hasFeatureAccess(currentUser, 'geospatial_export');
  const hasFullDatasetAccess = hasFeatureAccess(currentUser, 'geospatial_full_dataset');

  // Data point limits
  const maxDataPoints = userLimits.geospatialPoints || 10;
  const isDataLimited = maxDataPoints !== -1 && data.length > maxDataPoints;
  const limitedData = isDataLimited ? data.slice(0, maxDataPoints) : data;

  const tabs = [
    { id: 'setup', name: 'Setup', icon: Icons.Settings, description: 'Configure data columns' },
    {
      id: 'map',
      name: 'Interactive Map',
      icon: Icons.MapPin,
      description: hasInteractiveAccess ? 'View data on map' : 'Preview map (Limited)',
      premium: !hasInteractiveAccess
    },
    {
      id: 'routes',
      name: 'Route Analysis',
      icon: Icons.Route,
      description: hasRouteAccess ? 'Analyze GPS routes' : 'Premium Feature',
      premium: !hasRouteAccess,
      disabled: !hasRouteAccess
    },
    {
      id: 'stats',
      name: 'Statistics',
      icon: Icons.BarChart,
      description: 'Geographic insights'
    }
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
    // Check export access
    if (!hasExportAccess) {
      handlePremiumFeatureClick('geospatial_export');
      return;
    }

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

  // Handle premium feature access
  const handleUpgrade = (tier = 'pro') => {
    // Track feature usage for analytics
    if (currentUser) {
      console.log('Geospatial upgrade requested:', { userId: currentUser.id, tier, feature: 'geospatial_interactive' });
    }

    // Redirect to pricing page with context
    window.location.href = `/pricing?feature=geospatial&tier=${tier}&source=map_visualization`;
  };

  const handlePremiumFeatureClick = (featureId) => {
    if (!hasFeatureAccess(currentUser, featureId)) {
      setShowUpgradePrompt(true);
    }
  };

  const renderTabContent = () => {
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('GeospatialVisualization renderTabContent:', {
        activeTab,
        isConfigured,
        columnsLength: columns?.length || 0,
        dataLength: data?.length || 0,
        columnMapping
      });
    }

    switch (activeTab) {
      case 'setup':
        try {
          return (
            <GeospatialColumnMapper
              columns={columnNames}
              data={data}
              onMappingChange={handleMappingChange}
              initialMapping={columnMapping}
            />
          );
        } catch (error) {
          console.error('Error rendering GeospatialColumnMapper:', error);
          return (
            <Card className="p-8 text-center">
              <Icons.AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Setup Error</h3>
              <p className="text-gray-600 mb-4">
                There was an error loading the setup component: {error.message}
              </p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </Card>
          );
        }

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
                      onChange={(e) => {
                        const newType = e.target.value;
                        // Check if user has access to selected view type
                        if ((newType === 'clusters' && !hasClusteringAccess) ||
                            (newType === 'heatmap' && !hasHeatmapAccess)) {
                          setShowUpgradePrompt(true);
                          return;
                        }
                        setMapSettings(prev => ({ ...prev, type: newType }));
                      }}
                      className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="markers">Individual Markers</option>
                      <option
                        value="clusters"
                        disabled={!hasClusteringAccess}
                        className={!hasClusteringAccess ? 'text-gray-400' : ''}
                      >
                        Clustered Markers {!hasClusteringAccess ? '(Premium)' : ''}
                      </option>
                      <option
                        value="heatmap"
                        disabled={!hasHeatmapAccess}
                        className={!hasHeatmapAccess ? 'text-gray-400' : ''}
                      >
                        Heatmap {!hasHeatmapAccess ? '(Premium)' : ''}
                      </option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Height:</label>
                    <select
                      value={mapSettings.height}
                      onChange={(e) => setMapSettings(prev => ({ ...prev, height: e.target.value }))}
                      className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="400px">📱 Small (400px)</option>
                      <option value="600px">💻 Medium (600px)</option>
                      <option value="800px">🖥️ Large (800px)</option>
                      <option value="100vh">⛶ Full Screen</option>
                    </select>
                  </div>
                </div>

                {/* Premium Feature Indicator */}
                {(!hasClusteringAccess || !hasHeatmapAccess) && (
                  <div className="flex items-center space-x-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    <Icons.Lock className="w-3 h-3" />
                    <span>Some views require premium</span>
                  </div>
                )}

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
              data={hasFullDatasetAccess ? data : limitedData}
              latColumn={columnMapping.latitude}
              lngColumn={columnMapping.longitude}
              valueColumn={columnMapping.value}
              labelColumn={columnMapping.label}
              mapType={mapSettings.type}
              height={mapSettings.height}
              showControls={hasInteractiveAccess ? mapSettings.showControls : false}
              interactive={hasInteractiveAccess}
              allowClustering={hasClusteringAccess}
              allowHeatmaps={hasHeatmapAccess}
              totalDataPoints={data.length}
              limitedDataPoints={limitedData.length}
              onUpgrade={handleUpgrade}
              isPremiumLimited={!hasInteractiveAccess || isDataLimited}
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
        console.error('Unknown tab:', activeTab);
        return (
          <Card className="p-8 text-center">
            <Icons.AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tab Not Found</h3>
            <p className="text-gray-600">
              The selected tab "{activeTab}" could not be found.
            </p>
            <Button onClick={() => setActiveTab('setup')}>
              Go to Setup
            </Button>
          </Card>
        );
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Icons.MapPin className="w-4 h-4" />
              <span>
                {hasFullDatasetAccess ? data.length : `${limitedData.length} of ${data.length}`} data points
              </span>
            </div>

            {isDataLimited && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-medium">
                  Limited Preview
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setShowUpgradePrompt(true)}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Icons.Zap className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = (tab.id !== 'setup' && !isConfigured) || tab.disabled;
            const isPremium = tab.premium;

            const handleTabClick = () => {
              if (isDisabled) return;

              // Always allow setup and stats tabs
              if (tab.id === 'setup' || tab.id === 'stats') {
                setActiveTab(tab.id);
                return;
              }

              // Handle premium features for map and routes
              if (isPremium) {
                handlePremiumFeatureClick(tab.id === 'map' ? 'geospatial_interactive' : 'geospatial_route_analysis');
                return;
              }

              setActiveTab(tab.id);
            };

            return (
              <button
                key={tab.id}
                onClick={handleTabClick}
                disabled={isDisabled && !isPremium}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm relative
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : isDisabled && !isPremium
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : isPremium
                    ? 'border-transparent text-amber-600 hover:text-amber-700 hover:border-amber-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${isActive
                    ? 'text-blue-500'
                    : isDisabled && !isPremium
                    ? 'text-gray-400'
                    : isPremium
                    ? 'text-amber-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `} />
                {tab.name}
                {isPremium && (
                  <Icons.Zap className="ml-1 h-3 w-3 text-amber-500" />
                )}
                {isDisabled && !isPremium && (
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

      {/* Premium Upgrade Prompt */}
      {showUpgradePrompt && (
        <GeospatialUpgradePrompt
          onUpgrade={handleUpgrade}
          onDismiss={() => setShowUpgradePrompt(false)}
        />
      )}

      {/* Debug Panel (Development Only) */}
      <GeospatialDebugPanel
        data={data}
        columns={columnNames}
        columnMapping={columnMapping}
        processedData={processedData}
      />
    </div>
  );
};

export default GeospatialVisualization;






