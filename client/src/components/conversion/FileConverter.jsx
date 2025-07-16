import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileText, Settings, Check, AlertCircle, Loader2,
  X, Upload, Eye, Info, ChevronRight, FileCheck, Zap,
  HelpCircle, ArrowLeft, ArrowRight
} from 'lucide-react';
import { CONVERSION_FORMATS, getFormatsByCategory, convertData, downloadConvertedFile } from '../../utils/fileConverter';
import { fileAPI } from '../../services/api';
import { useConversionLimits, trackConversionLimitEvent } from '../../utils/conversionLimits';
import ConversionStatusIndicator from './ConversionStatusIndicator';
import Button from '../ui/Button';
import Card from '../ui/Card';

const FileConverter = ({ fileData, fileName, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [conversionOptions, setConversionOptions] = useState({});
  const [isConverting, setIsConverting] = useState(false);
  const [convertedContent, setConvertedContent] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileSize, setFileSize] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);

  // Conversion limits hook
  const { isAuthenticated, incrementCount } = useConversionLimits();

  const formatCategories = getFormatsByCategory();
  const totalSteps = 3;

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const stepVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: {
      x: -50,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  // Handle format selection with enhanced UX
  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setConvertedContent(null);
    setError(null);
    setShowPreview(false);
    setCurrentStep(2);

    // Set default options for the format
    const defaultOptions = getDefaultOptions(format.id);
    setConversionOptions(defaultOptions);

    // Calculate estimated file size
    if (fileData && Array.isArray(fileData)) {
      const estimatedSize = estimateFileSize(fileData, format.id);
      setFileSize(estimatedSize);
    }

    // Announce format selection for screen readers
    const announcement = `Selected ${format.name} format for conversion. ${format.description}`;
    announceToScreenReader(announcement);
  };

  // Estimate converted file size
  const estimateFileSize = (data, formatId) => {
    if (!data || !Array.isArray(data)) return 0;

    const sampleContent = convertData[`to${formatId.toUpperCase()}`]?.(data.slice(0, 10)) || '';
    const avgRowSize = sampleContent.length / Math.min(data.length, 10);
    return Math.round((avgRowSize * data.length) / 1024); // KB
  };

  // Screen reader announcements
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  // Get default options for each format
  const getDefaultOptions = (formatId) => {
    switch (formatId) {
      case 'html':
        return { 
          title: fileName || 'Data Table',
          includeStyles: true,
          className: 'data-table'
        };
      case 'sql':
        return { 
          tableName: 'data_table',
          includeCreateTable: true
        };
      case 'latex':
        return { 
          caption: 'Data Table',
          label: 'tab:data'
        };
      case 'xml':
        return { 
          rootElement: 'data',
          itemElement: 'item'
        };
      default:
        return {};
    }
  };

  // Enhanced conversion with progress tracking
  const handleConvert = async () => {
    if (!selectedFormat || !fileData) return;

    setIsConverting(true);
    setError(null);
    setConversionProgress(0);
    setCurrentStep(3);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 100);

      let content;

      // Use client-side conversion for immediate results
      switch (selectedFormat.id) {
        case 'csv':
          content = convertData.toCSV(fileData, conversionOptions);
          break;
        case 'tsv':
          content = convertData.toTSV(fileData, conversionOptions);
          break;
        case 'html':
          content = convertData.toHTML(fileData, conversionOptions);
          break;
        case 'markdown':
          content = convertData.toMarkdown(fileData, conversionOptions);
          break;
        case 'latex':
          content = convertData.toLaTeX(fileData, conversionOptions);
          break;
        case 'sql':
          content = convertData.toSQL(fileData, conversionOptions);
          break;
        case 'json':
          content = convertData.toJSON(fileData, conversionOptions);
          break;
        case 'yaml':
          content = convertData.toYAML(fileData, conversionOptions);
          break;
        case 'xml':
          content = convertData.toXML(fileData, conversionOptions);
          break;
        default:
          throw new Error(`Conversion to ${selectedFormat.name} not supported yet`);
      }

      // Complete progress
      clearInterval(progressInterval);
      setConversionProgress(100);

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      setConvertedContent(content);
      setShowPreview(true);

      // Track successful conversion completion
      trackConversionLimitEvent('conversion_completed', {
        format: selectedFormat.id,
        isAuthenticated,
        fileSize: content.length
      });

      // Announce success
      announceToScreenReader(`Conversion to ${selectedFormat.name} completed successfully. File is ready for download.`);

    } catch (err) {
      setError(err.message || 'Conversion failed');
      announceToScreenReader(`Conversion failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  // Enhanced download with analytics
  const handleDownload = () => {
    if (!convertedContent || !selectedFormat) return;

    const baseFileName = fileName?.replace(/\.[^/.]+$/, '') || 'converted_data';
    downloadConvertedFile(convertedContent, baseFileName, selectedFormat.id);

    // Track download for analytics
    if (window.gtag) {
      window.gtag('event', 'file_conversion_download', {
        format: selectedFormat.id,
        file_size: fileSize,
        source_format: getFileExtension(fileName)
      });
    }

    // Announce download
    announceToScreenReader(`Download started for ${baseFileName}.${selectedFormat.extension}`);
  };

  // Get file extension helper
  const getFileExtension = (filename) => {
    return filename?.split('.').pop()?.toLowerCase() || 'unknown';
  };

  // Navigation helpers
  const goToStep = (step) => {
    setCurrentStep(step);
    setError(null);
  };

  const canProceedToStep = (step) => {
    switch (step) {
      case 2: return selectedFormat !== null;
      case 3: return selectedFormat !== null && conversionOptions !== null;
      default: return true;
    }
  };

  // Update conversion options
  const updateOption = (key, value) => {
    setConversionOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get format use case examples
  const getFormatUseCase = (formatId) => {
    const useCases = {
      csv: 'Perfect for spreadsheet applications and data analysis',
      tsv: 'Ideal for tab-delimited data and database imports',
      html: 'Great for web pages and email reports',
      excel: 'Best for Microsoft Office and business presentations',
      markdown: 'Perfect for documentation and README files',
      latex: 'Ideal for academic papers and scientific documents',
      sql: 'Perfect for database imports and data migration',
      json: 'Great for APIs and web applications',
      yaml: 'Ideal for configuration files and DevOps',
      xml: 'Perfect for structured data exchange'
    };
    return useCases[formatId] || 'Versatile format for various applications';
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="converter-title"
      aria-describedby="converter-description"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header with Progress */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 id="converter-title" className="text-xl font-bold">
                  Universal File Converter
                </h2>
                <p id="converter-description" className="text-primary-100 text-sm">
                  Convert "{fileName}" to any format
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close converter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    currentStep >= step
                      ? 'bg-white text-primary-600'
                      : 'bg-white/20 text-white/70'
                  }`}
                  aria-label={`Step ${step} ${currentStep >= step ? 'completed' : 'pending'}`}
                >
                  {currentStep > step ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 transition-colors duration-300 ${
                      currentStep > step ? 'bg-white' : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mt-2 text-xs text-white/80">
            <span>Select Format</span>
            <span>Configure Options</span>
            <span>Download File</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Conversion Status Indicator */}
          <ConversionStatusIndicator className="mb-6" />
          <AnimatePresence mode="wait">
            {/* Step 1: Format Selection */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Choose Your Output Format
                  </h3>
                  <p className="text-gray-600">
                    Select the format you want to convert your data to
                  </p>
                </div>
                {/* Enhanced Format Categories */}
                <div className="space-y-8">
                  {Object.entries(formatCategories).map(([category, formats]) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-sm font-semibold text-primary-700 capitalize">
                            {category.charAt(0)}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 capitalize">
                          {category} Formats
                        </h4>
                        <div className="flex-1 h-px bg-gray-200 ml-4"></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formats.map((format) => (
                          <motion.button
                            key={format.id}
                            onClick={() => handleFormatSelect(format)}
                            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                              selectedFormat?.id === format.id
                                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-secondary-50 shadow-lg'
                                : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-white'
                            }`}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label={`Convert to ${format.name} format. ${format.description}`}
                            role="option"
                            aria-selected={selectedFormat?.id === format.id}
                          >
                            {/* Selection Indicator */}
                            {selectedFormat?.id === format.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}

                            {/* Format Icon */}
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                              {format.icon}
                            </div>

                            {/* Format Info */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="text-lg font-semibold text-gray-800">
                                  {format.name}
                                </h5>
                                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-mono">
                                  {format.extension}
                                </span>
                              </div>

                              <p className="text-sm text-gray-600 leading-relaxed">
                                {format.description}
                              </p>

                              {/* Use Cases */}
                              <div className="pt-2">
                                <p className="text-xs text-gray-500">
                                  {getFormatUseCase(format.id)}
                                </p>
                              </div>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => goToStep(2)}
                    disabled={!selectedFormat}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Options
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Configuration Options */}
            {currentStep === 2 && selectedFormat && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{selectedFormat.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Configure {selectedFormat.name} Options
                  </h3>
                  <p className="text-gray-600">
                    Customize your conversion settings for optimal results
                  </p>
                </div>

                {/* Format Info Card */}
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        Converting to {selectedFormat.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedFormat.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Estimated size</div>
                      <div className="text-lg font-semibold text-primary-700">
                        {fileSize > 0 ? `${fileSize} KB` : 'Calculating...'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Info className="w-4 h-4 mr-2" />
                    {getFormatUseCase(selectedFormat.id)}
                  </div>
                </div>

                {/* Configuration Options */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Conversion Settings
                  </h4>

                  <EnhancedConversionOptions
                    format={selectedFormat}
                    options={conversionOptions}
                    onUpdate={updateOption}
                  />
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => goToStep(1)}
                    variant="outline"
                    className="px-6 py-3"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Formats
                  </Button>

                  <Button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Convert File
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Conversion Progress and Download */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {isConverting ? (
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    ) : convertedContent ? (
                      <FileCheck className="w-8 h-8 text-green-600" />
                    ) : (
                      <Download className="w-8 h-8 text-primary-600" />
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {isConverting ? 'Converting Your File...' :
                     convertedContent ? 'Conversion Complete!' :
                     'Ready to Convert'}
                  </h3>

                  <p className="text-gray-600">
                    {isConverting ? 'Please wait while we process your data' :
                     convertedContent ? 'Your file has been successfully converted' :
                     'Click convert to start the process'}
                  </p>
                </div>

                {/* Progress Bar */}
                {isConverting && (
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${conversionProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-800 font-semibold mb-1">Conversion Failed</h4>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Success and Download */}
                {convertedContent && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Success Card */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-3" />
                          <div>
                            <h4 className="text-green-800 font-semibold">
                              Successfully converted to {selectedFormat.name}
                            </h4>
                            <p className="text-green-700 text-sm">
                              File size: {Math.round(convertedContent.length / 1024)} KB
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handleDownload}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    </div>

                    {/* Preview */}
                    {showPreview && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-gray-800 flex items-center">
                            <Eye className="w-5 h-5 mr-2" />
                            Preview
                          </h5>
                          <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label="Toggle preview"
                          >
                            <ChevronRight className={`w-5 h-5 transition-transform ${showPreview ? 'rotate-90' : ''}`} />
                          </button>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-60 overflow-auto">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                            {convertedContent.substring(0, 2000)}
                            {convertedContent.length > 2000 && (
                              <span className="text-gray-500">
                                \n... ({convertedContent.length - 2000} more characters)
                              </span>
                            )}
                          </pre>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => goToStep(2)}
                    variant="outline"
                    className="px-6 py-3"
                    disabled={isConverting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Options
                  </Button>

                  {convertedContent && (
                    <Button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedFormat(null);
                        setConvertedContent(null);
                        setError(null);
                      }}
                      variant="outline"
                      className="px-6 py-3"
                    >
                      Convert Another File
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};



// Enhanced Conversion Options Component
const EnhancedConversionOptions = ({ format, options, onUpdate }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-2";
  const checkboxClasses = "w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2";

  switch (format.id) {
    case 'html':
      return (
        <div className="space-y-6">
          {/* Basic Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses} htmlFor="html-title">
                Table Title
                <HelpCircle
                  className="w-4 h-4 inline ml-1 text-gray-400"
                  title="The title that will appear above your HTML table"
                />
              </label>
              <input
                id="html-title"
                type="text"
                value={options.title || ''}
                onChange={(e) => onUpdate('title', e.target.value)}
                className={inputClasses}
                placeholder="My Data Table"
                aria-describedby="html-title-help"
              />
              <p id="html-title-help" className="text-xs text-gray-500 mt-1">
                This will be displayed as the main heading
              </p>
            </div>

            <div>
              <label className={labelClasses} htmlFor="html-class">
                CSS Class Name
              </label>
              <input
                id="html-class"
                type="text"
                value={options.className || ''}
                onChange={(e) => onUpdate('className', e.target.value)}
                className={inputClasses}
                placeholder="data-table"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="include-styles"
                type="checkbox"
                checked={options.includeStyles || false}
                onChange={(e) => onUpdate('includeStyles', e.target.checked)}
                className={checkboxClasses}
              />
              <label htmlFor="include-styles" className="ml-3 text-sm text-gray-700">
                Include CSS styles for better formatting
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="responsive-table"
                type="checkbox"
                checked={options.responsive || false}
                onChange={(e) => onUpdate('responsive', e.target.checked)}
                className={checkboxClasses}
              />
              <label htmlFor="responsive-table" className="ml-3 text-sm text-gray-700">
                Make table responsive for mobile devices
              </label>
            </div>
          </div>
        </div>
      );

    case 'sql':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses} htmlFor="sql-table">
                Table Name
              </label>
              <input
                id="sql-table"
                type="text"
                value={options.tableName || ''}
                onChange={(e) => onUpdate('tableName', e.target.value)}
                className={inputClasses}
                placeholder="my_data_table"
                pattern="[a-zA-Z_][a-zA-Z0-9_]*"
                aria-describedby="sql-table-help"
              />
              <p id="sql-table-help" className="text-xs text-gray-500 mt-1">
                Use only letters, numbers, and underscores
              </p>
            </div>

            <div>
              <label className={labelClasses} htmlFor="sql-database">
                Database Type
              </label>
              <select
                id="sql-database"
                value={options.databaseType || 'mysql'}
                onChange={(e) => onUpdate('databaseType', e.target.value)}
                className={inputClasses}
              >
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="sqlite">SQLite</option>
                <option value="mssql">SQL Server</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="create-table"
                type="checkbox"
                checked={options.includeCreateTable || false}
                onChange={(e) => onUpdate('includeCreateTable', e.target.checked)}
                className={checkboxClasses}
              />
              <label htmlFor="create-table" className="ml-3 text-sm text-gray-700">
                Include CREATE TABLE statement
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="drop-table"
                type="checkbox"
                checked={options.includeDropTable || false}
                onChange={(e) => onUpdate('includeDropTable', e.target.checked)}
                className={checkboxClasses}
              />
              <label htmlFor="drop-table" className="ml-3 text-sm text-gray-700">
                Include DROP TABLE IF EXISTS statement
              </label>
            </div>
          </div>
        </div>
      );

    case 'latex':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses} htmlFor="latex-caption">
                Table Caption
              </label>
              <input
                id="latex-caption"
                type="text"
                value={options.caption || ''}
                onChange={(e) => onUpdate('caption', e.target.value)}
                className={inputClasses}
                placeholder="Data Analysis Results"
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="latex-label">
                Table Label
              </label>
              <input
                id="latex-label"
                type="text"
                value={options.label || ''}
                onChange={(e) => onUpdate('label', e.target.value)}
                className={inputClasses}
                placeholder="tab:results"
              />
            </div>
          </div>
        </div>
      );

    case 'json':
      return (
        <div className="space-y-6">
          <div className="flex items-center">
            <input
              id="json-pretty"
              type="checkbox"
              checked={options.pretty !== false}
              onChange={(e) => onUpdate('pretty', e.target.checked)}
              className={checkboxClasses}
            />
            <label htmlFor="json-pretty" className="ml-3 text-sm text-gray-700">
              Pretty print with indentation
            </label>
          </div>
        </div>
      );

    case 'xml':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses} htmlFor="xml-root">
                Root Element
              </label>
              <input
                id="xml-root"
                type="text"
                value={options.rootElement || ''}
                onChange={(e) => onUpdate('rootElement', e.target.value)}
                className={inputClasses}
                placeholder="data"
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="xml-item">
                Item Element
              </label>
              <input
                id="xml-item"
                type="text"
                value={options.itemElement || ''}
                onChange={(e) => onUpdate('itemElement', e.target.value)}
                className={inputClasses}
                placeholder="item"
              />
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="text-center py-8">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No additional configuration needed for {format.name} format.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Your file will be converted using optimal default settings.
          </p>
        </div>
      );
  }
};

export default FileConverter;
