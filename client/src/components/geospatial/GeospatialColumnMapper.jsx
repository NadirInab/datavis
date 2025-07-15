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
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState({});
  const [validationResults, setValidationResults] = useState({});

  // Auto-detect geographic columns
  useEffect(() => {
    // Ensure columns is an array before processing
    const safeColumns = Array.isArray(columns) ? columns : [];
    const safeData = Array.isArray(data) ? data : [];

    if (safeColumns.length > 0) {
      const detected = autoDetectColumns(safeColumns, safeData);
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

    // Validate inputs
    if (!Array.isArray(cols) || cols.length === 0) {
      return detected;
    }

    const safeSampleData = Array.isArray(sampleData) ? sampleData : [];

    // Enhanced patterns with more variations and intelligent matching
    const latPatterns = /^(lat|latitude|lat_deg|lat_decimal|lat_dd|y|coord_y|geo_lat|north|ns|y_coordinate|y_pos|LAT|LATITUDE|Lat|Latitude)$/i;
    const lngPatterns = /^(lng|lon|long|longitude|lng_deg|lng_decimal|lng_dd|x|coord_x|geo_lng|geo_lon|east|ew|x_coordinate|x_pos|LNG|LON|LONG|LONGITUDE|Lng|Lon|Long|Longitude)$/i;
    const valuePatterns = /^(value|amount|count|quantity|sales|revenue|population|score|price|total|sum|num|number|val|VALUE|Value|AMOUNT|Amount|COUNT|Count|POPULATION|Population)$/i;
    const labelPatterns = /^(name|title|label|description|location|place|city|address|business_name|company|site|venue|NAME|Name|TITLE|Title|LABEL|Label|CITY|City|LOCATION|Location)$/i;
    const categoryPatterns = /^(category|type|group|class|industry|sector|kind|cat|grp|CATEGORY|Category|TYPE|Type|GROUP|Group|CLASS|Class)$/i;
    const timestampPatterns = /^(timestamp|time|date|datetime|created_at|updated_at|ts|dt|when|TIME|Time|DATE|Date|TIMESTAMP|Timestamp)$/i;

    cols.forEach(col => {
      if (typeof col !== 'string') return; // Skip non-string columns

      // Test against original column name (preserves case sensitivity)
      if (latPatterns.test(col)) {
        detected.latitude = col;
      } else if (lngPatterns.test(col)) {
        detected.longitude = col;
      } else if (valuePatterns.test(col)) {
        detected.value = col;
      } else if (labelPatterns.test(col)) {
        detected.label = col;
      } else if (categoryPatterns.test(col)) {
        detected.category = col;
      } else if (timestampPatterns.test(col)) {
        detected.timestamp = col;
      }
    });

    // If no exact matches, try to detect by data content
    if ((!detected.latitude || !detected.longitude) && safeSampleData.length > 0) {
      const numericColumns = cols.filter(col => {
        if (typeof col !== 'string') return false;

        const sample = safeSampleData.slice(0, 10);
        return sample.length > 0 && sample.every(row => {
          if (!row || typeof row !== 'object') return false;
          const val = parseFloat(row[col]);
          return !isNaN(val);
        });
      });

      numericColumns.forEach(col => {
        const values = safeSampleData.slice(0, 20)
          .map(row => row && typeof row === 'object' ? parseFloat(row[col]) : NaN)
          .filter(val => !isNaN(val));

        if (values.length === 0) return;

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
    // Validate inputs
    if (!Array.isArray(data) || data.length === 0 || !currentMapping) {
      return [];
    }

    setIsProcessing(true);

    const preview = data.slice(0, 5).map((row, index) => {
      if (!row || typeof row !== 'object') {
        return {
          index: index + 1,
          latitude: 'Invalid',
          longitude: 'Invalid',
          value: '',
          label: `Point ${index + 1}`,
          isValid: false,
          validationIssues: ['Invalid row data']
        };
      }

      const lat = parseFloat(row[currentMapping.latitude]);
      const lng = parseFloat(row[currentMapping.longitude]);
      const validationIssues = [];

      // Enhanced validation
      if (isNaN(lat)) validationIssues.push('Invalid latitude');
      else if (lat < -90 || lat > 90) validationIssues.push('Latitude out of range (-90 to 90)');

      if (isNaN(lng)) validationIssues.push('Invalid longitude');
      else if (lng < -180 || lng > 180) validationIssues.push('Longitude out of range (-180 to 180)');

      const isValid = validationIssues.length === 0;

      return {
        index: index + 1,
        latitude: lat,
        longitude: lng,
        value: currentMapping.value ? row[currentMapping.value] : '',
        label: currentMapping.label ? row[currentMapping.label] : `Point ${index + 1}`,
        isValid,
        validationIssues,
        confidence: isValid ? 'high' : 'low'
      };
    });

    // Calculate overall validation results
    const totalPoints = data.length;
    const validPoints = data.filter(row => {
      if (!row || typeof row !== 'object') return false;
      const lat = parseFloat(row[currentMapping.latitude]);
      const lng = parseFloat(row[currentMapping.longitude]);
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }).length;

    setValidationResults({
      totalPoints,
      validPoints,
      invalidPoints: totalPoints - validPoints,
      validationRate: totalPoints > 0 ? (validPoints / totalPoints * 100).toFixed(1) : 0
    });

    setTimeout(() => setIsProcessing(false), 300); // Small delay for visual feedback

    return preview;
  };

  const handleMappingChange = (field, value) => {
    const newMapping = { ...mapping, [field]: value };
    setMapping(newMapping);
  };

  const getColumnStats = (columnName) => {
    if (!columnName || !Array.isArray(data) || data.length === 0) return null;

    const values = data
      .filter(row => row && typeof row === 'object')
      .map(row => row[columnName])
      .filter(val => val !== null && val !== undefined && val !== '');

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

    // Ensure columns is always an array
    const safeColumns = Array.isArray(columns) ? columns : [];

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
          disabled={safeColumns.length === 0}
        >
          <option value="">
            {safeColumns.length === 0 ? 'No columns available...' : 'Select column...'}
          </option>
          {safeColumns.map(col => (
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

  // Validate props and show appropriate states
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeData = Array.isArray(data) ? data : [];

  // Show loading state if no columns are available yet
  if (safeColumns.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Icons.Loader className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Column Information
          </h3>
          <p className="text-sm text-gray-600">
            Please wait while we analyze your data structure...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Map Data Columns
        </h3>
        <p className="text-sm text-gray-600">
          Select which columns contain your geographic data. Latitude and longitude are required.
        </p>
        {safeData.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <Icons.AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-700">
                No data available for preview. Column mapping will still work.
              </span>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <Icons.Loader className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
              <span className="text-sm text-blue-700">
                Processing geographic data...
              </span>
            </div>
          </div>
        )}

        {/* Validation Results */}
        {validationResults.totalPoints > 0 && !isProcessing && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Icons.CheckCircle className={`w-4 h-4 mr-2 ${
                  validationResults.validationRate >= 90 ? 'text-green-600' :
                  validationResults.validationRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <span className="text-sm font-medium text-gray-700">
                  Data Quality: {validationResults.validationRate}%
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {validationResults.validPoints} of {validationResults.totalPoints} points valid
              </div>
            </div>
            {validationResults.validationRate < 90 && (
              <div className="mt-2 text-xs text-gray-600">
                {validationResults.invalidPoints} points have coordinate issues
              </div>
            )}
          </div>
        )}
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

      {/* Manual Auto-Detection */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-gray-900">Column Detection</h4>
            <p className="text-sm text-gray-600">
              Automatically detect geographic columns based on common naming patterns
            </p>
          </div>
          <Button
            onClick={() => {
              const detected = autoDetectColumns(safeColumns, safeData);
              setDetectedColumns(detected);

              // Apply detected columns
              const newMapping = { ...mapping };
              Object.keys(detected).forEach(field => {
                if (detected[field] && !newMapping[field]) {
                  newMapping[field] = detected[field];
                }
              });
              setMapping(newMapping);
            }}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            title="Re-run automatic column detection"
          >
            <Icons.Target className="w-4 h-4" />
            <span>Auto-Detect</span>
          </Button>
        </div>

        {/* Detection Results */}
        {Object.keys(detectedColumns).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(detectedColumns).map(([field, column]) => (
              <div key={field} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                <Icons.CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="capitalize text-gray-600">{field}:</span>
                <span className="font-medium text-blue-700">{column}</span>
              </div>
            ))}
          </div>
        )}
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
                {Array.isArray(previewData) && previewData.map((row) => (
                  <tr key={row.index} className="border-b">
                    <td className="py-2 px-3">{row.index}</td>
                    <td className="py-2 px-3">{row.latitude}</td>
                    <td className="py-2 px-3">{row.longitude}</td>
                    {mapping.value && <td className="py-2 px-3">{row.value}</td>}
                    {mapping.label && <td className="py-2 px-3">{row.label}</td>}
                    <td className="py-2 px-3">
                      {row.isValid ? (
                        <div className="flex items-center space-x-1">
                          <Icons.CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600">Valid</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1" title={row.validationIssues?.join(', ')}>
                          <Icons.X className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-600">Invalid</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </Card>
  );
};

export default GeospatialColumnMapper;
