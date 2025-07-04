import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import {
  exportChartAsPNG,
  exportChartAsPDF,
  exportDataAsCSV,
  exportDataAsJSON,
  exportVisualizationConfig,
  canExport,
  generateExportSummary
} from '../utils/exportUtils';

const ExportMenu = ({
  data,
  visualization,
  file, // Add file prop as fallback
  chartElementId,
  filename = 'export',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  // Safe destructuring with fallback values
  const authContext = useAuth();
  const { currentUser } = authContext || {};
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  // Use file data as fallback if data prop is not provided
  const exportData = data || file?.data || [];
  const exportVisualization = visualization || (file?.visualizations && file.visualizations[0]) || null;

  // Handle upgrade button click
  const handleUpgradeClick = () => {
    setIsOpen(false); // Close the export menu
    navigate('/subscription-plans');
  };

  const handleExport = async (type) => {
    // Validate chartElementId is provided for chart exports
    if ((type === 'png' || type === 'pdf') && !chartElementId) {
      const errorMessage = 'Chart element ID is required for chart exports';
      console.error(errorMessage);
      onExportError?.(errorMessage);
      return;
    }

    // Check subscription permissions with fallback
    const userSubscription = currentUser?.subscription || 'visitor';
    if (!canExport(userSubscription, type)) {
      onExportError?.('This export format is not available in your current subscription plan.');
      return;
    }

    setIsExporting(true);
    setExportType(type);
    onExportStart?.(type);

    try {
      console.log(`Starting ${type} export with chart element ID: ${chartElementId}`);
      
      switch (type) {
        case 'png':
          await exportChartAsPNG(chartElementId, `${filename}_chart`);
          break;
        case 'pdf':
          await exportChartAsPDF(chartElementId, `${filename}_chart`);
          break;
        case 'csv':
          exportDataAsCSV(exportData, `${filename}_data`);
          break;
        case 'json':
          exportDataAsJSON(exportData, `${filename}_data`);
          break;
        case 'config':
          exportVisualizationConfig(exportVisualization, `${filename}_config`);
          break;
        default:
          throw new Error('Unsupported export type');
      }
      
      onExportComplete?.(type);
    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
      setExportType(null);
      setIsOpen(false);
    }
  };

  const getSubscriptionBadge = (requiredTier) => {
    const badges = {
      pro: 'Pro',
      enterprise: 'Enterprise'
    };
    return badges[requiredTier];
  };

  const isDisabled = (type) => {
    const userSubscription = currentUser?.subscription || 'visitor';
    return !canExport(userSubscription, type);
  };

  const exportOptions = [
    {
      type: 'png',
      label: 'Export Chart as PNG',
      icon: '🖼️',
      description: 'High-quality image format',
      requiredTier: 'free'
    },
    {
      type: 'pdf',
      label: 'Export Chart as PDF',
      icon: '📄',
      description: 'Professional document format',
      requiredTier: 'pro'
    },
    {
      type: 'csv',
      label: 'Export Data as CSV',
      icon: '📊',
      description: 'Spreadsheet-compatible format',
      requiredTier: 'free'
    },
    {
      type: 'json',
      label: 'Export Data as JSON',
      icon: '🔧',
      description: 'Developer-friendly format',
      requiredTier: 'free'
    },
    {
      type: 'config',
      label: 'Export Visualization Config',
      icon: '⚙️',
      description: 'Save chart configuration',
      requiredTier: 'enterprise'
    }
  ];

  const summary = generateExportSummary(exportData, exportVisualization ? [exportVisualization] : []);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporting {exportType}...
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
            <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {/* Export Summary */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Export Summary</h3>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>Data: {summary.dataRows} rows, {summary.dataColumns} columns</div>
                <div>Visualization: {exportVisualization?.title || 'No visualization selected'}</div>
              </div>
            </div>

            {/* Export Options */}
            <div className="max-h-64 overflow-y-auto">
              {exportOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleExport(option.type)}
                  disabled={isDisabled(option.type) || isExporting}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDisabled(option.type) ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="mr-2">{option.icon}</span>
                        <span className="font-medium text-gray-900">{option.label}</span>
                        {isDisabled(option.type) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {getSubscriptionBadge(option.requiredTier)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Subscription Upgrade Notice */}
            {currentUser?.subscription === 'free' && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-600">
                  <p className="font-medium">Unlock more export formats</p>
                  <p className="mt-1">
                    Upgrade to Pro for PDF exports or Enterprise for advanced features.
                  </p>
                  <button
                    onClick={handleUpgradeClick}
                    className="mt-2 text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-200"
                  >
                    View Plans →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ExportMenu;


