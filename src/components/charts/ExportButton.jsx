import React, { useState } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import { 
  exportChart, 
  exportData, 
  getAvailableExportFormats, 
  EXPORT_FORMATS 
} from '../../utils/chartExport';
import { hasFeatureAccess, getUpgradeSuggestion } from '../../utils/featureGating';
import { useUpgradePrompt } from '../premium/UpgradePrompt';

const ExportButton = ({ 
  chartElement, 
  data, 
  filename = 'chart',
  type = 'chart', // 'chart' or 'data'
  variant = 'ghost',
  size = 'sm'
}) => {
  const { currentUser } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { showUpgradePrompt } = useUpgradePrompt();

  const availableFormats = getAvailableExportFormats(currentUser);
  
  // Data export formats
  const dataFormats = [
    { id: 'data_export_csv', name: 'CSV', format: 'CSV' },
    { id: 'data_export_json', name: 'JSON', format: 'JSON' },
    { id: 'data_export_excel', name: 'Excel', format: 'EXCEL' }
  ];

  const handleExport = async (format) => {
    setIsExporting(true);
    setShowDropdown(false);

    try {
      if (type === 'chart') {
        if (!chartElement) {
          throw new Error('Chart element not found');
        }
        await exportChart(currentUser, chartElement, format, filename);
      } else {
        if (!data || data.length === 0) {
          throw new Error('No data to export');
        }
        await exportData(currentUser, data, format, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      
      // Check if it's a permission error and show upgrade prompt
      if (error.message.includes("don't have access")) {
        const formatId = type === 'chart' 
          ? EXPORT_FORMATS[format]?.id 
          : dataFormats.find(f => f.format === format)?.id;
        
        if (formatId) {
          const upgrade = getUpgradeSuggestion(currentUser, formatId);
          if (upgrade) {
            showUpgradePrompt(upgrade);
          }
        }
      } else {
        // Show error message (you could use a toast notification here)
        alert(error.message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatsForType = () => {
    if (type === 'chart') {
      return availableFormats.map(format => ({
        ...format,
        format: Object.keys(EXPORT_FORMATS).find(key => 
          EXPORT_FORMATS[key].id === format.id
        )
      }));
    } else {
      return dataFormats.filter(format => 
        hasFeatureAccess(currentUser, format.id)
      );
    }
  };

  const formats = getFormatsForType();

  // If no formats available, show upgrade prompt
  if (formats.length === 0) {
    return (
      <Button
        variant={variant}
        size={size}
        icon={Icons.Download}
        onClick={() => {
          const firstFormat = type === 'chart' 
            ? Object.values(EXPORT_FORMATS)[1] // Skip PNG (free)
            : dataFormats[1]; // Skip CSV (free)
          
          const upgrade = getUpgradeSuggestion(currentUser, firstFormat.id);
          if (upgrade) {
            showUpgradePrompt(upgrade);
          }
        }}
      >
        Export (Premium)
      </Button>
    );
  }

  // Single format - direct export
  if (formats.length === 1) {
    return (
      <Button
        variant={variant}
        size={size}
        icon={Icons.Download}
        onClick={() => handleExport(formats[0].format)}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : `Export ${formats[0].name || formats[0].format}`}
      </Button>
    );
  }

  // Multiple formats - dropdown
  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        icon={Icons.Download}
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {formats.map((format) => (
                <button
                  key={format.id || format.format}
                  onClick={() => handleExport(format.format)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Icons.Download className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{format.name || format.format}</div>
                    {format.description && (
                      <div className="text-xs text-gray-500">{format.description}</div>
                    )}
                  </div>
                </button>
              ))}
              
              {/* Premium formats (locked) */}
              {type === 'chart' && Object.values(EXPORT_FORMATS).some(format => 
                !hasFeatureAccess(currentUser, format.id)
              ) && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <div className="px-4 py-2 text-xs text-gray-500 font-medium">
                    Premium Formats
                  </div>
                  {Object.values(EXPORT_FORMATS)
                    .filter(format => !hasFeatureAccess(currentUser, format.id))
                    .map((format) => (
                      <button
                        key={format.id}
                        onClick={() => {
                          const upgrade = getUpgradeSuggestion(currentUser, format.id);
                          if (upgrade) {
                            showUpgradePrompt(upgrade);
                          }
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Icons.Lock className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{format.name}</div>
                          <div className="text-xs text-gray-400">{format.description}</div>
                        </div>
                      </button>
                    ))}
                </>
              )}
              
              {type === 'data' && dataFormats.some(format => 
                !hasFeatureAccess(currentUser, format.id)
              ) && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <div className="px-4 py-2 text-xs text-gray-500 font-medium">
                    Premium Formats
                  </div>
                  {dataFormats
                    .filter(format => !hasFeatureAccess(currentUser, format.id))
                    .map((format) => (
                      <button
                        key={format.id}
                        onClick={() => {
                          const upgrade = getUpgradeSuggestion(currentUser, format.id);
                          if (upgrade) {
                            showUpgradePrompt(upgrade);
                          }
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Icons.Lock className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{format.name}</div>
                          <div className="text-xs text-gray-400">Premium feature</div>
                        </div>
                      </button>
                    ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
