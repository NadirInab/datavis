import React, { useState, useEffect } from 'react';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GeospatialColumnMapper = ({ 
  columns = [], 
  data = [], 
  onMappingChange,
  initialMapping = {}
}) => {
  const [mapping, setMapping] = useState({
    latitude: initialMapping.latitude || '',
    longitude: initialMapping.longitude || '',
    value: initialMapping.value || '',
    label: initialMapping.label || '',
    category: initialMapping.category || '',
    timestamp: initialMapping.timestamp || ''
  });

  const [detectedColumns, setDetectedColumns] = useState({});
  const [previewData, setPreviewData] = useState([]);

  // Auto-detect geographic columns
  useEffect(() => {
    if (columns.length > 0) {
      const detected = autoDetectColumns(columns, data);
      setDetectedColumns(detected);
      
      // Auto-apply detected columns if no mapping exists
      if (!initialMapping.latitude && !initialMapping.longitude) {
        const newMapping = { ...mapping };
        if (detected.latitude) newMapping.latitude = detected.latitude;
        if (detected.longitude) newMapping.longitude = detected.longitude;
        if (detected.value) newMapping.value = detected.value;
        if (detected.label) newMapping.label = detected.label;
        
        setMapping(newMapping);
      }
    }
  }, [columns, data]);

  // Update preview when mapping changes
  useEffect(() => {
    if (mapping.latitude && mapping.longitude && data.length > 0) {
      const preview = generatePreviewData(data, mapping);
      setPreviewData(preview);
      
      if (onMappingChange) {
        onMappingChange(mapping, preview);
      }
    }
  }, [mapping, data, onMappingChange]);

  const autoDetectColumns = (cols, sampleData) => {
    const detected = {};
    
    // Common latitude column names
    const latPatterns = /^(lat|latitude|lat_deg|y|coord_y|geo_lat)$/i;
    // Common longitude column names  
    const lngPatterns = /^(lng|lon|long|longitude|lng_deg|x|coord_x|geo_lng|geo_lon)$/i;
    // Common value column names
    const valuePatterns = /^(value|amount|count|quantity|sales|revenue|population|score)$/i;
    // Common label column names
    const labelPatterns = /^(name|title|label|description|location|place|city|address)$/i;

    cols.forEach(col => {
      const colLower = col.toLowerCase();
      
      if (latPatterns.test(colLower)) {
        detected.latitude = col;
      } else if (lngPatterns.test(colLower)) {
        detected.longitude = col;
      } else if (valuePatterns.test(colLower)) {
        detected.value = col;
      } else if (labelPatterns.test(colLower)) {
        detected.label = col;
      }
    });

    // If no exact matches, try to detect by data content
    if (!detected.latitude || !detected.longitude) {
      const numericColumns = cols.filter(col => {
        const sample = sampleData.slice(0, 10);
        return sample.every(row => {
          const val = parseFloat(row[col]);
          return !isNaN(val);
        });
      });

      numericColumns.forEach(col => {
        const values = sampleData.slice(0, 20).map(row => parseFloat(row[col]));
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Latitude range: -90 to 90
        if (min >= -90 && max <= 90 && !detected.latitude) {
          detected.latitude = col;
        }
        // Longitude range: -180 to 180
        else if (min >= -180 && max <= 180 && !detected.longitude) {
          detected.longitude = col;
        }
      });
    }

    return detected;
  };

  const generatePreviewData = (data, currentMapping) => {
    const preview = data.slice(0, 5).map((row, index) => {
      const lat = parseFloat(row[currentMapping.latitude]);
      const lng = parseFloat(row[currentMapping.longitude]);
      
      return {
        index: index + 1,
        latitude: lat,
        longitude: lng,
        value: currentMapping.value ? row[currentMapping.value] : '',
        label: currentMapping.label ? row[currentMapping.label] : `Point ${index + 1}`,
        isValid: !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
      };
    });

    return preview;
  };

  const handleMappingChange = (field, value) => {
    const newMapping = { ...mapping, [field]: value };
    setMapping(newMapping);
  };

  const getColumnStats = (columnName) => {
    if (!columnName || data.length === 0) return null;
    
    const values = data.map(row => row[columnName]).filter(val => val !== null && val !== undefined && val !== '');
    const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
    
    return {
      total: data.length,
      nonEmpty: values.length,
      numeric: numericValues.length,
      min: numericValues.length > 0 ? Math.min(...numericValues) : null,
      max: numericValues.length > 0 ? Math.max(...numericValues) : null,
      sample: values.slice(0, 3)
    };
  };

  const renderColumnSelector = (field, label, required = false, description = '') => {
    const stats = getColumnStats(mapping[field]);
    const isDetected = detectedColumns[field] === mapping[field];
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {isDetected && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
              Auto-detected
            </span>
          )}
        </label>
        
        <select
          value={mapping[field]}
          onChange={(e) => handleMappingChange(field, e.target.value)}
          className={`w-full border rounded-md px-3 py-2 text-sm ${
            required && !mapping[field] ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select column...</option>
          {columns.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
        
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        
        {stats && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <div className="grid grid-cols-2 gap-2">
              <span>Non-empty: {stats.nonEmpty}/{stats.total}</span>
              {stats.numeric > 0 && (
                <span>Range: {stats.min?.toFixed(2)} to {stats.max?.toFixed(2)}</span>
              )}
            </div>
            {stats.sample.length > 0 && (
              <div className="mt-1">
                <span className="font-medium">Sample: </span>
                {stats.sample.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const validMappingExists = mapping.latitude && mapping.longitude;
  const validDataCount = previewData.filter(item => item.isValid).length;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Map Data Columns
        </h3>
        <p className="text-sm text-gray-600">
          Select which columns contain your geographic data. Latitude and longitude are required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Fields */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Required Fields</h4>
          
          {renderColumnSelector(
            'latitude',
            'Latitude',
            true,
            'Decimal degrees (-90 to 90)'
          )}
          
          {renderColumnSelector(
            'longitude',
            'Longitude',
            true,
            'Decimal degrees (-180 to 180)'
          )}
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Optional Fields</h4>
          
          {renderColumnSelector(
            'value',
            'Value',
            false,
            'Numeric values for heatmap intensity'
          )}
          
          {renderColumnSelector(
            'label',
            'Label',
            false,
            'Text to display in popups'
          )}
          
          {renderColumnSelector(
            'category',
            'Category',
            false,
            'Group data by categories'
          )}
        </div>
      </div>

      {/* Preview Section */}
      {validMappingExists && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-900 mb-3">Data Preview</h4>
          
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {validDataCount} of {previewData.length} preview rows have valid coordinates
            </span>
            {validDataCount === 0 && (
              <span className="text-sm text-red-600 flex items-center">
                <Icons.AlertTriangle className="w-4 h-4 mr-1" />
                No valid coordinates found
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Latitude</th>
                  <th className="text-left py-2 px-3">Longitude</th>
                  {mapping.value && <th className="text-left py-2 px-3">Value</th>}
                  {mapping.label && <th className="text-left py-2 px-3">Label</th>}
                  <th className="text-left py-2 px-3">Valid</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row) => (
                  <tr key={row.index} className="border-b">
                    <td className="py-2 px-3">{row.index}</td>
                    <td className="py-2 px-3">{row.latitude}</td>
                    <td className="py-2 px-3">{row.longitude}</td>
                    {mapping.value && <td className="py-2 px-3">{row.value}</td>}
                    {mapping.label && <td className="py-2 px-3">{row.label}</td>}
                    <td className="py-2 px-3">
                      {row.isValid ? (
                        <Icons.CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Icons.XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Auto-detection Results */}
      {Object.keys(detectedColumns).length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-900 mb-3">Auto-Detection Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(detectedColumns).map(([field, column]) => (
              <div key={field} className="flex items-center space-x-2">
                <Icons.Target className="w-4 h-4 text-blue-500" />
                <span className="capitalize text-gray-600">{field}:</span>
                <span className="font-medium">{column}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default GeospatialColumnMapper;
