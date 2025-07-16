import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, Download, ArrowRight, Zap, Shield, Clock,
  CheckCircle, AlertCircle, X, FileCheck, Loader2, Info, Home
} from 'lucide-react';
import { CONVERSION_FORMATS, getFormatsByCategory } from '../utils/fileConverter';
import { parseFile } from '../utils/fileParser';
import FileConverter from '../components/conversion/FileConverter';
import ConversionStatusIndicator from '../components/conversion/ConversionStatusIndicator';
import ConversionLimitModal from '../components/conversion/ConversionLimitModal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useConversionLimits, trackConversionLimitEvent } from '../utils/conversionLimits';

const FileConversionHub = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [showConverter, setShowConverter] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const fileInputRef = useRef(null);

  // Conversion limits hook
  const {
    isAuthenticated,
    checkLimit,
    incrementCount,
    getStatus,
    getRemainingTime
  } = useConversionLimits();

  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const formatCategories = getFormatsByCategory();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Enhanced file selection with validation and conversion limits
  const handleFileSelect = async (file) => {
    setUploadError(null);
    setUploadProgress(0);

    // Check conversion limits first
    const limitCheck = checkLimit();
    if (!limitCheck.allowed) {
      setShowLimitModal(true);
      trackConversionLimitEvent('limit_reached', {
        remaining: limitCheck.remaining,
        isAuthenticated
      });
      return;
    }

    // File validation
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/tab-separated-values',
      'text/plain'
    ];

    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json', '.tsv', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    // Validate file size
    if (file.size > maxSize) {
      setUploadError(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 100MB limit.`);
      return;
    }

    // Validate file type
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setUploadError(`File type not supported. Please upload CSV, Excel, JSON, or TSV files.`);
      return;
    }

    try {
      setIsProcessing(true);
      setSelectedFile(file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 100);

      const parsedData = await parseFile(file);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Increment conversion count for visitors
      incrementCount();

      // Track successful conversion
      trackConversionLimitEvent('conversion_started', {
        remaining: limitCheck.remaining - 1,
        isAuthenticated,
        fileType: fileExtension
      });

      setFileData(parsedData.data);
      setShowConverter(true);

      // Announce success for screen readers
      announceToScreenReader(`File ${file.name} uploaded successfully. ${parsedData.data?.length || 0} rows detected.`);

    } catch (error) {
      console.error('Error parsing file:', error);
      setUploadError(
        error.message ||
        'Error parsing file. Please ensure it\'s a valid CSV, Excel, JSON, or TSV file with proper formatting.'
      );
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
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

  // Enhanced drag and drop with better feedback
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
      // Visual feedback for valid/invalid files
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const file = items[0];
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
        // Could add visual indication of file validity here
      }
    } else if (e.type === "dragleave") {
      // Only set dragActive to false if we're leaving the drop zone entirely
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > 1) {
        setUploadError('Please upload only one file at a time.');
        return;
      }
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  // Clear error handler
  const clearError = () => {
    setUploadError(null);
  };

  // Helper functions for enhanced format display
  const getCategoryGradient = (category) => {
    const gradients = {
      data: 'from-blue-500 to-blue-600',
      web: 'from-green-500 to-green-600',
      office: 'from-orange-500 to-orange-600',
      database: 'from-purple-500 to-purple-600',
      config: 'from-indigo-500 to-indigo-600'
    };
    return gradients[category] || 'from-gray-500 to-gray-600';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      data: '📊',
      web: '🌐',
      office: '📈',
      database: '🗄️',
      config: '⚙️'
    };
    return icons[category] || '📄';
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      data: 'Structured data formats for analysis and processing',
      web: 'Web-compatible formats for online display and sharing',
      office: 'Business and productivity application formats',
      database: 'Database and query language formats',
      config: 'Configuration and markup language formats'
    };
    return descriptions[category] || 'Various file formats for different use cases';
  };

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
    <div className="min-h-screen bg-gradient-to-br from-highlight-50/20 via-white to-primary-50/10">
      {/* Navigation Header */}
      <div className="relative z-50 px-4 sm:px-6 lg:px-8 pt-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-center"
          >
            {/* Back to Home Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="group border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 transition-all duration-300 shadow-sm hover:shadow-md focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                icon={Home}
                aria-label="Navigate back to home page"
              >
                <span className="hidden sm:inline group-hover:text-primary-800 transition-colors duration-200">Back to Home</span>
                <span className="sm:hidden group-hover:text-primary-800 transition-colors duration-200">Home</span>
              </Button>
            </motion.div>

            {/* Page Title Badge */}
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary-200 shadow-sm">
              <FileText className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">File Converter</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Hero Section */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-primary-200/20 to-secondary-200/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-br from-secondary-200/20 to-accent-200/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-br from-accent-200/15 to-highlight-200/20 rounded-full blur-xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="text-center mb-12"
          >
            {/* Enhanced Header */}
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl mb-6 shadow-lg">
                <FileText className="w-10 h-10 text-primary-600" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-primary-900 mb-4 tracking-tight">
                Universal File Converter
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 mx-auto rounded-full"></div>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-primary-600 max-w-4xl mx-auto mb-8 leading-relaxed font-light"
            >
              Transform your data files into any format you need. Professional-grade conversion
              with support for 10+ formats including CSV, Excel, JSON, HTML, SQL, and more.
            </motion.p>

            {/* Feature Highlights */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-6 mb-12"
            >
              {[
                { icon: Zap, text: "Lightning Fast", color: "primary" },
                { icon: Shield, text: "100% Secure", color: "secondary" },
                { icon: CheckCircle, text: "Free Account = Unlimited", color: "accent" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.text}
                  className={`flex items-center space-x-2 px-4 py-2 bg-${feature.color}-50 rounded-full border border-${feature.color}-200`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <feature.icon className={`w-4 h-4 text-${feature.color}-600`} />
                  <span className={`text-sm font-medium text-${feature.color}-700`}>
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Conversion Status Indicator */}
            <motion.div variants={itemVariants}>
              <ConversionStatusIndicator
                className="mb-6"
                showUpgradePrompt={!isAuthenticated}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="relative">
                <div
                  className={`relative backdrop-blur-sm rounded-3xl p-12 transition-all duration-500 border-2 ${
                    dragActive
                      ? 'border-primary-500 bg-gradient-to-br from-primary-50/80 to-secondary-50/60 scale-[1.02] shadow-2xl'
                      : uploadError
                      ? 'border-red-300 bg-gradient-to-br from-red-50/80 to-red-100/40'
                      : selectedFile
                      ? 'border-green-300 bg-gradient-to-br from-green-50/80 to-green-100/40'
                      : 'border-gray-200 bg-gradient-to-br from-white/90 to-gray-50/50 hover:border-primary-300 hover:shadow-xl'
                  } ${isProcessing ? 'pointer-events-none' : 'cursor-pointer'}`}
                  style={{
                    background: dragActive
                      ? 'linear-gradient(135deg, rgba(90, 130, 126, 0.1), rgba(132, 174, 146, 0.05))'
                      : uploadError
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.05))'
                      : selectedFile
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(74, 222, 128, 0.05))'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.8))'
                  }}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="File upload area. Drag and drop files here or click to browse."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.tsv,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                  aria-describedby="file-upload-description"
                  disabled={isProcessing}
                />

                <div className="text-center relative">
                  {/* Enhanced Dynamic Icon */}
                  <div className="mb-8">
                    {isProcessing ? (
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                        </div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl blur-lg animate-pulse"></div>
                      </div>
                    ) : dragActive ? (
                      <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="relative"
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                          <Download className="w-10 h-10 text-primary-600" />
                        </div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary-500/30 to-secondary-500/30 rounded-3xl blur-lg"></div>
                      </motion.div>
                    ) : uploadError ? (
                      <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                      </div>
                    ) : selectedFile ? (
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <FileCheck className="w-10 h-10 text-green-600" />
                      </div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300"
                      >
                        <Upload className="w-10 h-10 text-primary-600" />
                      </motion.div>
                    )}
                  </div>

                  {/* Enhanced Dynamic Content */}
                  {isProcessing ? (
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        Processing Your File
                      </h3>
                      <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                        Please wait while we analyze and prepare your data for conversion
                      </p>
                      {uploadProgress > 0 && (
                        <div className="max-w-sm mx-auto">
                          <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <motion.div
                              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full shadow-sm"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-500">Processing...</span>
                            <span className="text-sm font-semibold text-primary-600">
                              {Math.round(uploadProgress)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : uploadError ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-red-800 mb-3">
                          Upload Failed
                        </h3>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 max-w-lg mx-auto">
                          <p className="text-red-700 text-sm leading-relaxed">
                            {uploadError}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button
                          onClick={clearError}
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50 px-6 py-3"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Error
                        </Button>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : selectedFile ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-green-800 mb-3">
                          File Ready for Conversion
                        </h3>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 max-w-lg mx-auto">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileCheck className="w-5 h-5 text-green-600" />
                              <div className="text-left">
                                <p className="text-green-800 font-semibold text-sm truncate max-w-xs">
                                  {selectedFile.name}
                                </p>
                                <p className="text-green-600 text-xs">
                                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready to convert
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50 px-6 py-3"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Different File
                      </Button>
                    </div>
                  ) : dragActive ? (
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-primary-800 mb-3">
                        Drop Your File Here
                      </h3>
                      <p className="text-lg text-primary-600 max-w-md mx-auto">
                        Release to start the conversion process
                      </p>
                      <div className="flex items-center justify-center space-x-2 text-primary-500">
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <ArrowRight className="w-5 h-5 rotate-90" />
                        </motion.div>
                        <span className="text-sm font-medium">Drop now</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">
                          Upload Your Data File
                        </h3>
                        <p id="file-upload-description" className="text-lg text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed">
                          Drag and drop your file here, or click to browse. We support CSV, Excel, JSON,
                          and TSV files up to 100MB.
                        </p>
                      </div>

                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Upload className="w-5 h-5 mr-3" />
                        Choose File to Convert
                      </Button>

                      <p className="text-sm text-gray-500 mt-4">
                        Or drag and drop your file anywhere in this area
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Supported Formats Indicator */}
                {!isProcessing && !uploadError && !selectedFile && (
                  <div className="mt-10">
                    <div className="flex flex-wrap justify-center gap-3">
                      {[
                        { name: 'CSV', color: 'bg-green-500', icon: '📊' },
                        { name: 'Excel', color: 'bg-blue-500', icon: '📈' },
                        { name: 'JSON', color: 'bg-yellow-500', icon: '🔧' },
                        { name: 'TSV', color: 'bg-purple-500', icon: '📋' }
                      ].map((format, index) => (
                        <motion.div
                          key={format.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-200 shadow-sm"
                        >
                          <span className="text-sm">{format.icon}</span>
                          <div className={`w-2 h-2 ${format.color} rounded-full`}></div>
                          <span className="text-xs font-medium text-gray-700">{format.name}</span>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Supported input formats • Maximum file size: 100MB
                    </p>
                  </div>
                )}
              </div>
            </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Supported Formats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-gray-50/30 to-primary-50/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary-100 to-accent-100 rounded-2xl mb-6 shadow-lg">
                <FileText className="w-8 h-8 text-secondary-600" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-primary-900 mb-4 tracking-tight">
                Professional Format Support
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-secondary-500 to-accent-500 mx-auto rounded-full"></div>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xl text-primary-600 max-w-3xl mx-auto leading-relaxed"
            >
              Transform your data into any format you need. Our enterprise-grade conversion engine
              supports 10+ professional formats with optimized output quality.
            </motion.p>
          </motion.div>

          {/* Enhanced Format Categories */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-12"
          >
            {Object.entries(formatCategories).map(([category, formats], categoryIndex) => (
              <motion.div
                key={category}
                variants={itemVariants}
                className="relative"
              >
                {/* Category Header */}
                <div className="flex items-center mb-8">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryGradient(category)} rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                    <span className="text-lg font-bold text-white">
                      {getCategoryIcon(category)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 capitalize mb-1">
                      {category} Formats
                    </h3>
                    <p className="text-gray-600">
                      {getCategoryDescription(category)}
                    </p>
                  </div>
                  <div className="hidden md:block w-24 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                </div>

                {/* Format Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {formats.map((format, formatIndex) => (
                    <motion.div
                      key={format.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: categoryIndex * 0.1 + formatIndex * 0.05
                      }}
                      className="group relative"
                    >
                      <div className="relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl group-hover:shadow-2xl overflow-hidden">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Content */}
                        <div className="relative z-10 text-center">
                          {/* Format Icon */}
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <span className="text-3xl">{format.icon}</span>
                          </div>

                          {/* Format Info */}
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800 mb-1">
                                {format.name}
                              </h4>
                              <span className="inline-block bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full border border-primary-200">
                                {format.extension}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed min-h-[2.5rem]">
                              {format.description}
                            </p>

                            {/* Use Case */}
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 italic">
                                {getFormatUseCase(format.id)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50/40 via-secondary-50/20 to-accent-50/30 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-secondary-200/20 to-accent-200/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-48 h-48 bg-gradient-to-br from-primary-200/20 to-secondary-200/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-100 to-highlight-100 rounded-2xl mb-6 shadow-lg">
                <Zap className="w-8 h-8 text-accent-600" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-primary-900 mb-4 tracking-tight">
                Enterprise-Grade Features
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-accent-500 to-highlight-500 mx-auto rounded-full"></div>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xl text-primary-600 max-w-3xl mx-auto leading-relaxed"
            >
              Built for professionals who demand reliability, security, and performance in their data conversion workflows.
            </motion.p>
          </motion.div>

          {/* Enhanced Feature Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Zap,
                title: "Lightning Fast Processing",
                description: "Convert files instantly with our optimized processing engine. Advanced algorithms ensure maximum speed without compromising quality.",
                color: "primary",
                gradient: "from-primary-500 to-primary-600",
                bgGradient: "from-primary-50 to-primary-100"
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Bank-level security with 256-bit encryption. Your files are processed locally and never stored on our servers for complete privacy.",
                color: "secondary",
                gradient: "from-secondary-500 to-secondary-600",
                bgGradient: "from-secondary-50 to-secondary-100"
              },
              {
                icon: CheckCircle,
                title: "Free Account Benefits",
                description: "Create a free account in seconds to unlock unlimited conversions. No credit card required, no hidden fees, always free.",
                color: "accent",
                gradient: "from-accent-500 to-accent-600",
                bgGradient: "from-accent-50 to-accent-100"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group"
              >
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 h-full border border-gray-200 hover:border-primary-300 transition-all duration-500 hover:shadow-2xl group-hover:shadow-3xl overflow-hidden">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  {/* Content */}
                  <div className="relative z-10 text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-primary-800 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>

                    {/* Feature Highlights */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className={`w-4 h-4 text-${feature.color}-500`} />
                        <span className="text-sm font-medium text-gray-700">
                          {index === 0 ? "Sub-second conversion" :
                           index === 1 ? "Zero data retention" :
                           "Free unlimited access"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-highlight-50/20 to-primary-50/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-highlight-100 to-primary-100 rounded-2xl mb-6 shadow-lg">
                <ArrowRight className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-primary-900 mb-4 tracking-tight">
                Simple 3-Step Process
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-highlight-500 to-primary-500 mx-auto rounded-full"></div>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xl text-primary-600 max-w-3xl mx-auto leading-relaxed"
            >
              Converting your files has never been easier. Follow these simple steps to transform your data into any format you need.
            </motion.p>
          </motion.div>

          {/* Enhanced Step Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="relative"
          >
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <div className="flex justify-between items-center px-32">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="w-32 h-0.5 bg-gradient-to-r from-primary-300 to-secondary-300 origin-left"
                ></motion.div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  className="w-32 h-0.5 bg-gradient-to-r from-secondary-300 to-accent-300 origin-left"
                ></motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  icon: Upload,
                  step: "1",
                  title: "Upload Your File",
                  description: "Drag and drop or click to select your CSV, Excel, JSON, or TSV file. We support files up to 100MB.",
                  color: "primary",
                  gradient: "from-primary-500 to-primary-600",
                  bgGradient: "from-primary-50 to-primary-100"
                },
                {
                  icon: FileText,
                  step: "2",
                  title: "Choose Format",
                  description: "Select your desired output format from our comprehensive list of 10+ professional formats.",
                  color: "secondary",
                  gradient: "from-secondary-500 to-secondary-600",
                  bgGradient: "from-secondary-50 to-secondary-100"
                },
                {
                  icon: Download,
                  step: "3",
                  title: "Download Result",
                  description: "Get your converted file instantly with optimized formatting and download it to your device.",
                  color: "accent",
                  gradient: "from-accent-500 to-accent-600",
                  bgGradient: "from-accent-50 to-accent-100"
                }
              ].map((step, index) => (
                <motion.div
                  key={step.step}
                  variants={itemVariants}
                  className="group text-center relative"
                >
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-primary-300 transition-all duration-500 hover:shadow-xl group-hover:shadow-2xl overflow-hidden">
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                    {/* Step Number */}
                    <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">{step.step}</span>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className="w-10 h-10 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-primary-800 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {step.description}
                      </p>

                      {/* Progress Indicator */}
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-center">
                          <div className="flex space-x-1">
                            {[1, 2, 3].map((dot) => (
                              <div
                                key={dot}
                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                  dot <= parseInt(step.step)
                                    ? `bg-${step.color}-500`
                                    : 'bg-gray-300'
                                }`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* File Converter Modal */}
      {showConverter && (
        <FileConverter
          fileData={fileData}
          fileName={selectedFile?.name}
          onClose={() => {
            setShowConverter(false);
            setSelectedFile(null);
            setFileData(null);
          }}
        />
      )}

      {/* Conversion Limit Modal */}
      <ConversionLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        conversionStatus={getStatus()}
        remainingTime={getRemainingTime()}
      />
    </div>
  );
};

export default FileConversionHub;
