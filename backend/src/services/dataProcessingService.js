const Papa = require('papaparse');
const fs = require('fs-extra');
const path = require('path');

class DataProcessingService {
  constructor() {
    this.maxSampleRows = 10;
    this.maxPreviewRows = 100;
  }

  /**
   * Parse CSV file and extract metadata
   * @param {string} filePath - Path to the CSV file
   * @param {Object} options - Parsing options
   * @returns {Object} Parsed data with metadata
   */
  async parseCSVFile(filePath, options = {}) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      return this.parseCSVContent(fileContent, options);
    } catch (error) {
      console.error('Error parsing CSV file:', error);
      throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
  }

  /**
   * Parse CSV content string
   * @param {string} content - CSV content
   * @param {Object} options - Parsing options
   * @returns {Object} Parsed data with metadata
   */
  parseCSVContent(content, options = {}) {
    try {
      const parseOptions = {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
        ...options
      };

      const result = Papa.parse(content, parseOptions);

      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
      }

      const data = result.data;
      const headers = result.meta.fields || [];

      // Generate metadata
      const metadata = this.generateDataMetadata(data, headers);

      return {
        success: true,
        data,
        headers,
        metadata,
        errors: result.errors,
        totalRows: data.length,
        totalColumns: headers.length
      };
    } catch (error) {
      console.error('Error parsing CSV content:', error);
      throw new Error(`Failed to parse CSV content: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive metadata for the dataset
   * @param {Array} data - Parsed data array
   * @param {Array} headers - Column headers
   * @returns {Object} Data metadata
   */
  generateDataMetadata(data, headers) {
    const metadata = {
      rows: data.length,
      columns: headers.length,
      headers: [],
      sampleData: data.slice(0, this.maxSampleRows),
      statistics: {},
      dataTypes: {},
      quality: {
        completeness: 0,
        consistency: 0,
        duplicates: 0,
        nullValues: 0
      }
    };

    // Analyze each column
    headers.forEach(header => {
      const columnData = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
      const columnInfo = this.analyzeColumn(header, columnData, data.length);
      
      metadata.headers.push(columnInfo);
      metadata.statistics[header] = columnInfo.statistics;
      metadata.dataTypes[header] = columnInfo.type;
    });

    // Calculate overall data quality metrics
    metadata.quality = this.calculateDataQuality(data, headers);

    return metadata;
  }

  /**
   * Analyze individual column
   * @param {string} columnName - Column name
   * @param {Array} columnData - Column data (non-empty values)
   * @param {number} totalRows - Total number of rows
   * @returns {Object} Column analysis
   */
  analyzeColumn(columnName, columnData, totalRows) {
    const analysis = {
      name: columnName,
      type: 'string',
      nullable: columnData.length < totalRows,
      unique: false,
      statistics: {}
    };

    // Determine data type
    analysis.type = this.detectDataType(columnData);

    // Calculate uniqueness
    const uniqueValues = new Set(columnData);
    analysis.unique = uniqueValues.size === columnData.length;

    // Generate statistics based on data type
    switch (analysis.type) {
      case 'number':
        analysis.statistics = this.calculateNumericStatistics(columnData);
        break;
      case 'date':
        analysis.statistics = this.calculateDateStatistics(columnData);
        break;
      case 'boolean':
        analysis.statistics = this.calculateBooleanStatistics(columnData);
        break;
      default:
        analysis.statistics = this.calculateStringStatistics(columnData);
    }

    // Add general statistics
    analysis.statistics.count = columnData.length;
    analysis.statistics.nullCount = totalRows - columnData.length;
    analysis.statistics.uniqueCount = uniqueValues.size;
    analysis.statistics.completeness = (columnData.length / totalRows) * 100;

    return analysis;
  }

  /**
   * Detect data type of column values
   * @param {Array} values - Column values
   * @returns {string} Detected data type
   */
  detectDataType(values) {
    if (values.length === 0) return 'string';

    const sampleSize = Math.min(values.length, 100);
    const sample = values.slice(0, sampleSize);

    let numberCount = 0;
    let dateCount = 0;
    let booleanCount = 0;

    sample.forEach(value => {
      const strValue = String(value).toLowerCase();

      // Check for boolean
      if (['true', 'false', 'yes', 'no', '1', '0'].includes(strValue)) {
        booleanCount++;
      }
      // Check for number
      else if (!isNaN(parseFloat(value)) && isFinite(value)) {
        numberCount++;
      }
      // Check for date
      else if (!isNaN(Date.parse(value))) {
        dateCount++;
      }
    });

    const threshold = sampleSize * 0.8; // 80% threshold

    if (numberCount >= threshold) return 'number';
    if (dateCount >= threshold) return 'date';
    if (booleanCount >= threshold) return 'boolean';
    
    return 'string';
  }

  /**
   * Calculate numeric statistics
   * @param {Array} values - Numeric values
   * @returns {Object} Numeric statistics
   */
  calculateNumericStatistics(values) {
    const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    
    if (numbers.length === 0) {
      return { min: null, max: null, mean: null, median: null, std: null };
    }

    numbers.sort((a, b) => a - b);
    
    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    const mean = sum / numbers.length;
    
    // Calculate median
    const mid = Math.floor(numbers.length / 2);
    const median = numbers.length % 2 === 0 
      ? (numbers[mid - 1] + numbers[mid]) / 2 
      : numbers[mid];

    // Calculate standard deviation
    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    const std = Math.sqrt(variance);

    return {
      min: min,
      max: max,
      mean: parseFloat(mean.toFixed(2)),
      median: median,
      std: parseFloat(std.toFixed(2)),
      sum: sum,
      range: max - min
    };
  }

  /**
   * Calculate date statistics
   * @param {Array} values - Date values
   * @returns {Object} Date statistics
   */
  calculateDateStatistics(values) {
    const dates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
    
    if (dates.length === 0) {
      return { earliest: null, latest: null, range: null };
    }

    dates.sort((a, b) => a - b);
    
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const range = latest - earliest;

    return {
      earliest: earliest.toISOString(),
      latest: latest.toISOString(),
      range: Math.floor(range / (1000 * 60 * 60 * 24)), // days
      format: this.detectDateFormat(values[0])
    };
  }

  /**
   * Calculate boolean statistics
   * @param {Array} values - Boolean values
   * @returns {Object} Boolean statistics
   */
  calculateBooleanStatistics(values) {
    const booleans = values.map(v => {
      const str = String(v).toLowerCase();
      return ['true', 'yes', '1'].includes(str);
    });

    const trueCount = booleans.filter(b => b).length;
    const falseCount = booleans.length - trueCount;

    return {
      trueCount,
      falseCount,
      truePercentage: parseFloat(((trueCount / booleans.length) * 100).toFixed(2)),
      falsePercentage: parseFloat(((falseCount / booleans.length) * 100).toFixed(2))
    };
  }

  /**
   * Calculate string statistics
   * @param {Array} values - String values
   * @returns {Object} String statistics
   */
  calculateStringStatistics(values) {
    const lengths = values.map(v => String(v).length);
    const uniqueValues = [...new Set(values)];

    return {
      minLength: Math.min(...lengths),
      maxLength: Math.max(...lengths),
      avgLength: parseFloat((lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(2)),
      uniqueValues: uniqueValues.slice(0, 10), // First 10 unique values
      pattern: this.detectStringPattern(values)
    };
  }

  /**
   * Detect date format
   * @param {string} dateString - Date string
   * @returns {string} Detected format
   */
  detectDateFormat(dateString) {
    const formats = [
      { pattern: /^\d{4}-\d{2}-\d{2}$/, format: 'YYYY-MM-DD' },
      { pattern: /^\d{2}\/\d{2}\/\d{4}$/, format: 'MM/DD/YYYY' },
      { pattern: /^\d{2}-\d{2}-\d{4}$/, format: 'MM-DD-YYYY' },
      { pattern: /^\d{4}\/\d{2}\/\d{2}$/, format: 'YYYY/MM/DD' }
    ];

    for (const { pattern, format } of formats) {
      if (pattern.test(dateString)) {
        return format;
      }
    }

    return 'Unknown';
  }

  /**
   * Detect string pattern
   * @param {Array} values - String values
   * @returns {string} Detected pattern
   */
  detectStringPattern(values) {
    const sample = values.slice(0, 10);
    
    // Check for email pattern
    if (sample.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
      return 'email';
    }
    
    // Check for phone pattern
    if (sample.every(v => /^[\+]?[\d\s\-\(\)]+$/.test(v))) {
      return 'phone';
    }
    
    // Check for URL pattern
    if (sample.every(v => /^https?:\/\//.test(v))) {
      return 'url';
    }

    return 'text';
  }

  /**
   * Calculate overall data quality metrics
   * @param {Array} data - Dataset
   * @param {Array} headers - Column headers
   * @returns {Object} Data quality metrics
   */
  calculateDataQuality(data, headers) {
    let totalCells = data.length * headers.length;
    let nullCells = 0;
    let duplicateRows = 0;

    // Count null/empty cells
    data.forEach(row => {
      headers.forEach(header => {
        const value = row[header];
        if (value === null || value === undefined || value === '') {
          nullCells++;
        }
      });
    });

    // Count duplicate rows
    const rowStrings = data.map(row => JSON.stringify(row));
    const uniqueRows = new Set(rowStrings);
    duplicateRows = data.length - uniqueRows.size;

    const completeness = ((totalCells - nullCells) / totalCells) * 100;
    const consistency = 100; // Placeholder - would need more complex analysis
    
    return {
      completeness: parseFloat(completeness.toFixed(2)),
      consistency: parseFloat(consistency.toFixed(2)),
      duplicates: duplicateRows,
      nullValues: nullCells,
      totalCells
    };
  }

  /**
   * Validate file format and content
   * @param {string} filePath - File path
   * @param {Object} constraints - Validation constraints
   * @returns {Object} Validation result
   */
  async validateFile(filePath, constraints = {}) {
    try {
      const fileInfo = await fs.stat(filePath);
      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        fileSize: fileInfo.size
      };

      // Check file size
      if (constraints.maxSize && fileInfo.size > constraints.maxSize) {
        validation.valid = false;
        validation.errors.push(`File size (${fileInfo.size} bytes) exceeds maximum allowed size (${constraints.maxSize} bytes)`);
      }

      // Parse and validate content
      try {
        const parseResult = await this.parseCSVFile(filePath);
        
        // Check row count
        if (constraints.maxRows && parseResult.totalRows > constraints.maxRows) {
          validation.valid = false;
          validation.errors.push(`Row count (${parseResult.totalRows}) exceeds maximum allowed rows (${constraints.maxRows})`);
        }

        // Check for minimum data requirements
        if (parseResult.totalRows === 0) {
          validation.valid = false;
          validation.errors.push('File contains no data rows');
        }

        if (parseResult.totalColumns === 0) {
          validation.valid = false;
          validation.errors.push('File contains no columns');
        }

        // Add parsing warnings
        if (parseResult.errors.length > 0) {
          validation.warnings.push(...parseResult.errors.map(err => err.message));
        }

        validation.parseResult = parseResult;

      } catch (parseError) {
        validation.valid = false;
        validation.errors.push(`Failed to parse file: ${parseError.message}`);
      }

      return validation;
    } catch (error) {
      return {
        valid: false,
        errors: [`File validation failed: ${error.message}`],
        warnings: []
      };
    }
  }
}

module.exports = new DataProcessingService();
