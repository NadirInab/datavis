import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import Papa from 'papaparse';
import Button, { Icons } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { UploadProgress, LoadingOverlay } from '../components/loading/LoadingSpinner';
import { parseFile, parseGoogleSheets, SUPPORTED_FORMATS, detectFileFormat } from '../utils/fileParser';
import { validateFileFormatAccess, trackFeatureUsage } from '../utils/featureGating';
import UpgradePrompt, { useUpgradePrompt } from '../components/premium/UpgradePrompt';
import { 
  validateFileUpload, 
  validateFileContent, 
  recordGuestUpload, 
  checkGuestUploadLimit,
  checkUserUploadLimit,
  getGuestMetrics,
  getUserMetrics
} from '../utils/rateLimiting';
import SignupPrompt from '../components/guest/SignupPrompt';
import fileService from '../services/fileService';
import GuestMetrics from '../components/guest/GuestMetrics';

const FileUploadEnhanced = () => {
  const { 
    currentUser, 
    hasReachedFileLimit, 
    incrementFileCount, 
    recordVisitorUpload,
    canUpload,
    isVisitor,
    visitorStats,
    fingerprintReady,
    getVisitorId
  } = useAuth();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [visualizations, setVisualizations] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [showGoogleSheets, setShowGoogleSheets] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showUpgradePrompt, UpgradePromptComponent } = useUpgradePrompt();

  // Get visitor ID on component mount
  useEffect(() => {
    const initializeVisitorId = async () => {
      if (isVisitor() && fingerprintReady) {
        try {
          const id = await getVisitorId();
          setVisitorId(id);
          console.log('Visitor ID initialized:', id);
        } catch (error) {
          console.error('Failed to get visitor ID:', error);
        }
      }
    };

    initializeVisitorId();
  }, [isVisitor, fingerprintReady, getVisitorId]);

  // Load metrics on component mount and when user changes
  useEffect(() => {
    const loadMetrics = () => {
      if (isVisitor() || !currentUser) {
        if (visitorStats) {
          setMetrics({
            filesUploaded: visitorStats.totalUploads,
            maxFiles: visitorStats.maxUploads,
            remainingFiles: visitorStats.remainingUploads,
            canUpload: visitorStats.canUpload,
            visitorId: visitorStats.visitorId,
            fingerprintReady
          });
        } else {
          setMetrics(getGuestMetrics());
        }
      } else {
        setMetrics(getUserMetrics(currentUser));
      }
    };

    loadMetrics();
    
    // Update metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser, isVisitor, visitorStats, fingerprintReady]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    await validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = async (selectedFile) => {
    setError('');
    setFile(null);
    setParsedData(null);
    setUploadStatus('idle');

    try {
      // Enhanced file validation with fingerprint-based tracking
      let validation;
      
      if (isVisitor() || !currentUser) {
        // For visitors, use fingerprint-based validation
        validation = await canUpload(selectedFile.size);
        if (!validation.allowed) {
          setError(validation.reason);
          
          if (validation.upgradeRequired === 'signup') {
            setShowSignupPrompt(true);
          }
          return;
        }
      } else {
        // For authenticated users, use existing validation
        validation = validateFileUpload(selectedFile, currentUser);
        if (!validation.valid) {
          setError(validation.error);
          
          if (validation.upgrade === 'signup') {
            setShowSignupPrompt(true);
          } else if (validation.upgrade) {
            showUpgradePrompt(validation.upgrade);
          }
          return;
        }
      }

      // Security validation
      const contentValidation = await validateFileContent(selectedFile);
      if (!contentValidation.valid) {
        setError(contentValidation.error);
        return;
      }

      // Additional format validation
      const detectedFormat = detectFileFormat(selectedFile);
      if (!detectedFormat) {
        setError('Unsupported file format. Please upload CSV, Excel, JSON, XML, TSV, or TXT files.');
        return;
      }

      const access = validateFileFormatAccess(currentUser, detectedFormat);
      if (!access.allowed) {
        if (access.upgrade) {
          showUpgradePrompt(access.upgrade);
        } else {
          setError(access.reason);
        }
        return;
      }

      setFile(selectedFile);
    } catch (error) {
      console.error('File validation error:', error);
      setError('An error occurred while validating the file. Please try again.');
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    await validateAndSetFile(droppedFile);
  };
  
  const analyzeDataTypes = (results) => {
    const data = results.data;
    if (!data || data.length <= 1) return {};
    
    const headers = data[0];
    const types = {};
    
    headers.forEach(header => {
      types[header] = {
        numeric: 0,
        date: 0,
        string: 0,
        boolean: 0,
        null: 0,
        total: 0
      };
    });
    
    const sampleSize = Math.min(data.length - 1, 100);
    for (let i = 1; i < 1 + sampleSize; i++) {
      const row = data[i];
      headers.forEach((header, index) => {
        const value = row[index];
        types[header].total++;
        
        if (value === null || value === undefined || value === '') {
          types[header].null++;
        } else if (!isNaN(Number(value))) {
          types[header].numeric++;
        } else if (/^\d{4}-\d{2}-\d{2}.*/.test(value) || /^\d{2}[\/\-]\d{2}[\/\-]\d{4}.*/.test(value)) {
          types[header].date++;
        } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
          types[header].boolean++;
        } else {
          types[header].string++;
        }
      });
    }
    
    const columnTypes = {};
    headers.forEach(header => {
      const typeInfo = types[header];
      const { numeric, date, string, boolean, null: nullCount, total } = typeInfo;
      
      if (nullCount / total > 0.9) {
        columnTypes[header] = 'null';
      } else if (numeric / (total - nullCount) > 0.8) {
        columnTypes[header] = 'numeric';
      } else if (date / (total - nullCount) > 0.8) {
        columnTypes[header] = 'date';
      } else if (boolean / (total - nullCount) > 0.8) {
        columnTypes[header] = 'boolean';
      } else {
        columnTypes[header] = 'string';
      }
    });
    
    return columnTypes;
  };
  
  const recommendVisualizations = (data, columnTypes) => {
    const headers = Object.keys(columnTypes);
    const numericColumns = headers.filter(h => columnTypes[h] === 'numeric');
    const dateColumns = headers.filter(h => columnTypes[h] === 'date');
    const categoryColumns = headers.filter(h => columnTypes[h] === 'string' || columnTypes[h] === 'boolean');

    const visualizations = [];
    const dataSize = data.length;
    const uniqueCategoryValues = {};

    categoryColumns.forEach(col => {
      const uniqueValues = [...new Set(data.map(row => row[col]))];
      uniqueCategoryValues[col] = uniqueValues.length;
    });

    if (dateColumns.length > 0 && numericColumns.length > 0) {
      visualizations.push({
        type: 'line',
        title: `${numericColumns[0]} Trend Over Time`,
        columns: {
          x: dateColumns[0],
          y: numericColumns[0]
        }
      });

      if (numericColumns.length > 1) {
        visualizations.push({
          type: 'area',
          title: `${numericColumns[0]} and ${numericColumns[1]} Over Time`,
          columns: {
            x: dateColumns[0],
            y: [numericColumns[0], numericColumns[1]]
          }
        });
      }
    }

    if (numericColumns.length > 0 && categoryColumns.length > 0) {
      const bestCategorical = categoryColumns.reduce((best, col) => {
        const currentUnique = uniqueCategoryValues[col];
        const bestUnique = uniqueCategoryValues[best];

        if (currentUnique >= 2 && currentUnique <= 20) {
          if (bestUnique < 2 || bestUnique > 20 || currentUnique < bestUnique) {
            return col;
          }
        }
        return best;
      });

      if (uniqueCategoryValues[bestCategorical] <= 20) {
        visualizations.push({
          type: 'bar',
          title: `${numericColumns[0]} by ${bestCategorical}`,
          columns: {
            x: bestCategorical,
            y: numericColumns[0]
          }
        });

        if (uniqueCategoryValues[bestCategorical] >= 2 && uniqueCategoryValues[bestCategorical] <= 8) {
          visualizations.push({
            type: 'pie',
            title: `Distribution of ${bestCategorical}`,
            columns: {
              name: bestCategorical,
              value: numericColumns.length > 0 ? numericColumns[0] : 'count'
            }
          });
        }
      }
    }

    if (numericColumns.length >= 2) {
      visualizations.push({
        type: 'bubble',
        title: `${numericColumns[0]} vs ${numericColumns[1]} Analysis`,
        columns: {
          x: numericColumns[0],
          y: numericColumns[1],
          z: numericColumns[2] || numericColumns[0]
        }
      });
    }

    if (numericColumns.length >= 3 && dataSize <= 100) {
      visualizations.push({
        type: 'radar',
        title: `Multi-dimensional Performance Analysis`,
        columns: {
          subject: categoryColumns[0] || 'Item',
          metrics: numericColumns.slice(0, 6)
        }
      });
    }

    if (categoryColumns.length > 1 && numericColumns.length > 0) {
      const secondBestCategorical = categoryColumns.find(col =>
        col !== categoryColumns[0] &&
        uniqueCategoryValues[col] >= 2 &&
        uniqueCategoryValues[col] <= 15
      );

      if (secondBestCategorical) {
        visualizations.push({
          type: 'bar',
          title: `${numericColumns[0]} by ${secondBestCategorical}`,
          columns: {
            x: secondBestCategorical,
            y: numericColumns[0]
          }
        });
      }
    }

    if (visualizations.length === 0) {
      if (headers.length >= 2) {
        visualizations.push({
          type: 'bar',
          title: `${headers[1]} by ${headers[0]}`,
          columns: {
            x: headers[0],
            y: headers[1]
          }
        });
      }
    }

    return visualizations;
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Final validation before upload
    let validation;
    if (isVisitor() || !currentUser) {
      validation = await canUpload(file.size);
      if (!validation.allowed) {
        setError(validation.reason);
        if (validation.upgradeRequired === 'signup') {
          setShowSignupPrompt(true);
        }
        return;
      }
    } else {
      validation = validateFileUpload(file, currentUser);
      if (!validation.valid) {
        setError(validation.error);
        if (validation.upgrade === 'signup') {
          setShowSignupPrompt(true);
        }
        return;
      }
    }

    setLoading(true);
    setProgress(0);
    setError('');
    setUploadStatus('uploading');

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 70) {
            clearInterval(progressInterval);
            return 70;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      setUploadStatus('processing');
      setProgress(75);

      const results = await parseFile(file);

      clearInterval(progressInterval);
      setProgress(85);

      if (!results.data || results.data.length === 0) {
        throw new Error('The file appears to be empty or contains no valid data');
      }

      const formatFeatureMap = {
        CSV: 'csv_upload',
        TSV: 'tsv_upload',
        EXCEL: 'excel_upload',
        JSON: 'json_upload',
        XML: 'xml_upload',
        TXT: 'txt_upload'
      };

      const featureId = formatFeatureMap[results.detectedFormat];
      if (featureId) {
        trackFeatureUsage(currentUser, featureId);
      }

      setParsedData(results);
      setProgress(90);
      setUploadStatus('preview');

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'An error occurred while processing your file');
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!parsedData) return;

    try {
      setLoading(true);
      setProgress(90);

      const recommendedVisualizations = recommendVisualizations(parsedData.data, parsedData.columnAnalysis);

      const fileId = Date.now().toString();
      // Apply smart data sampling based on user type and storage limits
      const maxDataRows = isVisitor() ? 500 : (currentUser?.subscription?.tier === 'premium' ? 5000 : 1000);
      const sampledData = parsedData.data.slice(0, maxDataRows);

      const fileRecord = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        format: parsedData.detectedFormat,
        uploadedAt: new Date().toISOString(),
        rows: parsedData.rowCount,
        columns: parsedData.headers, // Store actual column names array
        columnCount: parsedData.headers.length, // Store count separately
        columnTypes: parsedData.columnAnalysis,
        visualizations: recommendedVisualizations,
        data: sampledData,
        visitorId: visitorId, // Include visitor ID for tracking
        samplingInfo: sampledData.length < parsedData.data.length ? {
          originalRows: parsedData.rowCount,
          sampledRows: sampledData.length,
          samplingMethod: 'truncation'
        } : null
      };

      // Use smart file service to handle storage
      try {
        await fileService.saveFile(fileRecord, currentUser, isVisitor);
        console.log('✅ File saved successfully using smart file service');
      } catch (storageError) {
        console.error('❌ Smart file service failed, attempting localStorage fallback:', storageError);

        // Fallback: Try to save with even smaller data sample
        const fallbackRecord = {
          ...fileRecord,
          data: sampledData.slice(0, 100), // Emergency fallback to 100 rows
          samplingInfo: {
            originalRows: parsedData.rowCount,
            sampledRows: 100,
            samplingMethod: 'emergency_fallback'
          }
        };

        try {
          const userId = currentUser?.id || (isVisitor() ? visitorId || 'visitor-session' : 'anonymous');
          const existingFiles = JSON.parse(localStorage.getItem(`files_${userId}`) || '[]');

          // Check localStorage space before saving
          const testData = JSON.stringify([...existingFiles, fallbackRecord]);
          if (testData.length > 4.5 * 1024 * 1024) { // 4.5MB limit to be safe
            throw new Error('Storage quota would be exceeded');
          }

          localStorage.setItem(`files_${userId}`, testData);
          console.log('⚠️ File saved with emergency fallback (100 rows only)');
        } catch (fallbackError) {
          console.error('❌ Emergency fallback also failed:', fallbackError);
          throw new Error('Storage quota exceeded. Please delete some files or upgrade your account for more storage.');
        }
      }

      // Record upload for metrics
      if (isVisitor() || !currentUser) {
        try {
          await recordVisitorUpload(file);
          console.log('Visitor upload recorded successfully');
        } catch (error) {
          console.error('Failed to record visitor upload:', error);
          // Continue anyway, don't block the upload
        }
      } else {
        incrementFileCount();
      }

      // Update metrics
      if (isVisitor() || !currentUser) {
        if (visitorStats) {
          setMetrics({
            filesUploaded: visitorStats.totalUploads + 1,
            maxFiles: visitorStats.maxUploads,
            remainingFiles: Math.max(0, visitorStats.remainingUploads - 1),
            canUpload: visitorStats.remainingUploads > 1,
            visitorId: visitorStats.visitorId,
            fingerprintReady
          });
        }
      } else {
        setMetrics(getUserMetrics(currentUser));
      }

      setProgress(100);
      setUploadStatus('complete');

      setTimeout(() => {
        setLoading(false);
        navigate(`/app/visualize/${fileId}`);
      }, 1000);

    } catch (error) {
      console.error('Save error:', error);
      setError(error.message || 'An error occurred while saving your file');
      setUploadStatus('error');
      setLoading(false);
    }
  };

  const handleGoogleSheetsUpload = async () => {
    if (!googleSheetsUrl.trim()) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    const access = validateFileFormatAccess(currentUser, 'GOOGLE_SHEETS');
    if (!access.allowed) {
      if (access.upgrade) {
        showUpgradePrompt(access.upgrade);
      } else {
        setError(access.reason);
      }
      return;
    }

    setLoading(true);
    setError('');
    setProgress(0);
    setUploadStatus('uploading');

    try {
      setProgress(30);
      const results = await parseGoogleSheets(googleSheetsUrl);

      setProgress(70);
      trackFeatureUsage(currentUser, 'google_sheets');

      setParsedData(results);
      setProgress(90);
      setUploadStatus('preview');

    } catch (error) {
      console.error('Google Sheets error:', error);
      setError(error.message || 'Failed to import Google Sheets data');
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const supportedFormats = useMemo(() => {
    try {
      const formats = [];
      Object.entries(SUPPORTED_FORMATS).forEach(([key, format]) => {
        const access = validateFileFormatAccess(currentUser, key);
        formats.push({
          ...format,
          key,
          available: access.allowed,
          upgrade: access.upgrade
        });
      });
      return formats;
    } catch (error) {
      console.error('Error getting supported formats:', error);
      return [];
    }
  }, [currentUser]);

  const availableFormats = useMemo(() =>
    supportedFormats.filter(f => f.available), [supportedFormats]
  );

  const premiumFormats = useMemo(() =>
    supportedFormats.filter(f => !f.available), [supportedFormats]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {UpgradePromptComponent}
      
      {/* Signup Prompt for Guests */}
      <SignupPrompt
        isOpen={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
        reason="You've reached the guest upload limit"
        filesUploaded={metrics?.filesUploaded || 0}
        maxFiles={metrics?.maxFiles || 2}
        visitorId={visitorId}
        fingerprintReady={fingerprintReady}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Data File</h1>
          <p className="mt-2 text-gray-600">Transform your data into beautiful visualizations</p>
          {visitorId && fingerprintReady && (
            <p className="mt-1 text-xs text-gray-500">
              Visitor ID: {visitorId.substring(0, 8)}... (Persistent across sessions)
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Icons.Upload className="w-4 h-4" />
          <span>Secure upload • Multiple formats supported</span>
          {fingerprintReady && <Icons.Shield className="w-4 h-4 text-green-500" />}
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Supported Formats Info */}
          <Card className="p-4 mb-6">
            <h3 className="text-sm font-medium text-[#5A827E] mb-3">Supported File Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-medium text-[#84AE92] mb-2">Available to You</h4>
                <div className="flex flex-wrap gap-2">
                  {availableFormats.length > 0 ? (
                    availableFormats.map(format => (
                      <span key={format.key} className="inline-flex items-center px-2 py-1 rounded-md bg-[#B9D4AA]/20 text-xs text-[#5A827E]">
                        <Icons.Check className="w-3 h-3 mr-1 text-[#84AE92]" />
                        {format.displayName}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Loading formats...</span>
                  )}
                </div>
              </div>
              {premiumFormats.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-[#5A827E]/60 mb-2">Premium Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {premiumFormats.map(format => (
                      <button
                        key={format.key}
                        onClick={() => format.upgrade && showUpgradePrompt(format.upgrade)}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                        disabled={!format.upgrade}
                      >
                        <Icons.Lock className="w-3 h-3 mr-1" />
                        {format.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <LoadingOverlay isLoading={loading && uploadStatus === 'processing'} message="Analyzing your data...">
            <Card className="relative overflow-hidden">
              <div className="p-8">
                <div
                  className={`relative flex flex-col justify-center items-center px-8 py-12 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                    isDragOver
                      ? 'border-primary-400 bg-primary-50 scale-105'
                      : file
                        ? 'border-accent-400 bg-accent-50'
                        : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-25'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {!file ? (
                    <div className="space-y-6 text-center">
                      <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                        isDragOver ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-600'
                      }`}>
                        <Icons.Upload className="w-8 h-8" />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {isDragOver ? 'Drop your data file here' : 'Upload your data file'}
                        </h3>
                        <div className="flex items-center justify-center text-sm text-gray-600">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Choose file
                          </Button>
                          <span className="mx-2">or drag and drop</span>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept={availableFormats.length > 0 ? availableFormats.map(f => f.extensions.join(',')).join(',') : '.csv'}
                          onChange={handleFileChange}
                        />
                      </div>

                      {/* Google Sheets Option */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <div className="h-px bg-gray-200 flex-1"></div>
                          <span className="text-xs text-gray-500 px-2">OR</span>
                          <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowGoogleSheets(!showGoogleSheets)}
                          className="text-[#5A827E] hover:text-[#5A827E]/80"
                          icon={Icons.ExternalLink}
                        >
                          Import from Google Sheets
                        </Button>

                        {showGoogleSheets && (
                          <div className="mt-4 space-y-3">
                            <input
                              type="url"
                              placeholder="Paste Google Sheets URL here..."
                              value={googleSheetsUrl}
                              onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5A827E]/20 focus:border-[#5A827E]"
                            />
                            <div className="flex space-x-2">
                              <Button
                                onClick={handleGoogleSheetsUpload}
                                variant="primary"
                                size="sm"
                                disabled={!googleSheetsUrl.trim() || loading}
                                icon={Icons.Download}
                              >
                                Import
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowGoogleSheets(false);
                                  setGoogleSheetsUrl('');
                                }}
                                variant="ghost"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Make sure your Google Sheet is publicly accessible or shared with view permissions.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Icons.Check className="w-3 h-3 text-green-500" />
                          <span>{availableFormats.length || 1} format{availableFormats.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icons.Shield className="w-3 h-3 text-green-500" />
                          <span>Secure upload</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icons.Check className="w-3 h-3 text-green-500" />
                          <span>Smart analysis</span>
                        </div>
                        {fingerprintReady && (
                          <div className="flex items-center space-x-1">
                            <Icons.Shield className="w-3 h-3 text-blue-500" />
                            <span>Persistent tracking</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 mx-auto bg-accent-500 rounded-2xl flex items-center justify-center">
                        <Icons.Check className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setError('');
                          setUploadStatus('idle');
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Choose different file
                      </Button>
                    </div>
                  )}
                </div>

                {/* Data Preview */}
                {uploadStatus === 'preview' && parsedData && (
                  <div className="mt-6 space-y-4">
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Data Preview</h3>

                      {/* File Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-[#FAFFCA]/30 rounded-lg p-3">
                          <div className="text-xs text-[#5A827E]/60 mb-1">Format</div>
                          <div className="font-medium text-[#5A827E]">{parsedData.detectedFormat}</div>
                        </div>
                        <div className="bg-[#FAFFCA]/30 rounded-lg p-3">
                          <div className="text-xs text-[#5A827E]/60 mb-1">Rows</div>
                          <div className="font-medium text-[#5A827E]">{parsedData.rowCount.toLocaleString()}</div>
                        </div>
                        <div className="bg-[#FAFFCA]/30 rounded-lg p-3">
                          <div className="text-xs text-[#5A827E]/60 mb-1">Columns</div>
                          <div className="font-medium text-[#5A827E]">{parsedData.headers.length}</div>
                        </div>
                        <div className="bg-[#FAFFCA]/30 rounded-lg p-3">
                          <div className="text-xs text-[#5A827E]/60 mb-1">Size</div>
                          <div className="font-medium text-[#5A827E]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      </div>

                      {/* Data Table Preview */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {parsedData.headers.slice(0, 6).map((header, index) => (
                                  <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {header}
                                    {parsedData.columnAnalysis[header] && (
                                      <div className="text-xs text-gray-400 normal-case mt-1">
                                        {parsedData.columnAnalysis[header].dataType}
                                      </div>
                                    )}
                                  </th>
                                ))}
                                {parsedData.headers.length > 6 && (
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                                    +{parsedData.headers.length - 6} more
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {parsedData.data.slice(0, 5).map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {parsedData.headers.slice(0, 6).map((header, colIndex) => (
                                    <td key={colIndex} className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                      {String(row[header] || '').substring(0, 50)}
                                      {String(row[header] || '').length > 50 && '...'}
                                    </td>
                                  ))}
                                  {parsedData.headers.length > 6 && (
                                    <td className="px-4 py-3 text-sm text-gray-400">...</td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {parsedData.rowCount > 5 && (
                          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center">
                            Showing 5 of {parsedData.rowCount.toLocaleString()} rows
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <Button
                          onClick={handleConfirmUpload}
                          variant="primary"
                          icon={Icons.Check}
                          disabled={loading}
                        >
                          Confirm & Create Visualizations
                        </Button>
                        <Button
                          onClick={() => {
                            setFile(null);
                            setParsedData(null);
                            setUploadStatus('idle');
                            setError('');
                          }}
                          variant="ghost"
                          icon={Icons.X}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {loading && (
                  <div className="mt-6">
                    <UploadProgress
                      progress={progress}
                      fileName={file?.name || 'Unknown file'}
                      status={uploadStatus}
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <Icons.X className="w-5 h-5 text-red-500 mr-3" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {file && !loading && uploadStatus !== 'preview' && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleUpload}
                      variant="primary"
                      size="lg"
                      icon={Icons.ArrowRight}
                      iconPosition="right"
                      className="px-8"
                    >
                      Analyze & Visualize Data
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </LoadingOverlay>
        </div>

        {/* Metrics Sidebar */}
        <div className="lg:col-span-1">
          <GuestMetrics 
            visitorId={visitorId}
            fingerprintReady={fingerprintReady}
            customMetrics={metrics}
          />
        </div>
      </div>

      {/* Security & Subscription Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Icons.Shield className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Secure Upload</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2" />
                <span>File content validation</span>
              </div>
              <div className="flex items-center">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Malware protection</span>
              </div>
              <div className="flex items-center">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Size & format validation</span>
              </div>
              <div className="flex items-center">
                <Icons.Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Persistent visitor tracking</span>
              </div>
              {fingerprintReady && (
                <div className="flex items-center">
                  <Icons.Shield className="w-4 h-4 text-blue-500 mr-2" />
                  <span>FingerprintJS protection</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Subscription Info */}
        <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isVisitor() || !currentUser ? 'Guest' : 
                   currentUser?.subscription?.charAt(0).toUpperCase() + currentUser?.subscription?.slice(1)} Plan
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isVisitor() || !currentUser ? 
                    `Upload up to ${metrics?.maxFiles || 2} files • 2MB per file • CSV only` :
                   currentUser?.subscription === 'free' ? 'Upload up to 5 files • 5MB per file • Multiple formats' :
                   currentUser?.subscription === 'pro' ? 'Upload up to 50 files • 25MB per file • All features' :
                   'Upload up to 1000 files • 100MB per file • All features'}
                </p>
                {visitorId && fingerprintReady && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tracked across sessions with ID: {visitorId.substring(0, 12)}...
                  </p>
                )}
              </div>
              {(isVisitor() || !currentUser || currentUser?.subscription === 'free') && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                  onClick={() => isVisitor() || !currentUser ? setShowSignupPrompt(true) : showUpgradePrompt('pro')}
                >
                  {isVisitor() || !currentUser ? 'Sign Up' : 'Upgrade'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FileUploadEnhanced;