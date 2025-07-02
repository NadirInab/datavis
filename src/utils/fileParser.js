import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parseString as parseXML } from 'xml2js';

// Supported file formats and their configurations
export const SUPPORTED_FORMATS = {
  CSV: {
    extensions: ['.csv'],
    mimeTypes: ['text/csv', 'application/csv'],
    isPremium: false,
    displayName: 'CSV Files'
  },
  TSV: {
    extensions: ['.tsv'],
    mimeTypes: ['text/tab-separated-values', 'text/tsv'],
    isPremium: true,
    displayName: 'Tab-Separated Values'
  },
  EXCEL: {
    extensions: ['.xlsx', '.xls'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    isPremium: true,
    displayName: 'Excel Files'
  },
  JSON: {
    extensions: ['.json'],
    mimeTypes: ['application/json'],
    isPremium: true,
    displayName: 'JSON Files'
  },
  XML: {
    extensions: ['.xml'],
    mimeTypes: ['application/xml', 'text/xml'],
    isPremium: true,
    displayName: 'XML Files'
  },
  TXT: {
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
    isPremium: true,
    displayName: 'Text Files (Auto-detect delimiter)'
  }
};

// Data type inference
export const inferDataType = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'empty';
  }
  
  const str = String(value).trim();
  
  // Boolean
  if (['true', 'false', 'yes', 'no', '1', '0'].includes(str.toLowerCase())) {
    return 'boolean';
  }
  
  // Number
  if (!isNaN(str) && !isNaN(parseFloat(str))) {
    return str.includes('.') ? 'decimal' : 'integer';
  }
  
  // Date
  const dateValue = new Date(str);
  if (!isNaN(dateValue.getTime()) && str.length > 4) {
    return 'date';
  }
  
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return 'email';
  }
  
  // URL
  if (/^https?:\/\/.+/.test(str)) {
    return 'url';
  }
  
  return 'text';
};

// Analyze column types and suggest improvements
export const analyzeColumns = (data) => {
  if (!data || data.length === 0) return {};
  
  const headers = Object.keys(data[0]);
  const analysis = {};
  
  headers.forEach(header => {
    const values = data.slice(0, Math.min(100, data.length)).map(row => row[header]);
    const types = values.map(inferDataType);
    const typeCounts = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const dominantType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b
    );
    
    analysis[header] = {
      originalName: header,
      suggestedName: header.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      dataType: dominantType,
      sampleValues: values.slice(0, 5),
      uniqueCount: new Set(values).size,
      nullCount: values.filter(v => v === null || v === undefined || v === '').length
    };
  });
  
  return analysis;
};

// Detect file format based on extension and content
export const detectFileFormat = (file) => {
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  const mimeType = file.type;
  
  for (const [format, config] of Object.entries(SUPPORTED_FORMATS)) {
    if (config.extensions.includes(extension) || config.mimeTypes.includes(mimeType)) {
      return format;
    }
  }
  
  return null;
};

// CSV Parser (existing functionality)
const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          return;
        }
        
        resolve({
          data: results.data,
          headers: results.meta.fields,
          rowCount: results.data.length,
          format: 'CSV'
        });
      },
      error: (error) => reject(error)
    });
  });
};

// TSV Parser
const parseTSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      delimiter: '\t',
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`TSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          return;
        }
        
        resolve({
          data: results.data,
          headers: results.meta.fields,
          rowCount: results.data.length,
          format: 'TSV'
        });
      },
      error: (error) => reject(error)
    });
  });
};

// Excel Parser
const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use first sheet by default
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        });
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file appears to be empty'));
          return;
        }
        
        // First row as headers
        const headers = jsonData[0].map(h => String(h).trim());
        const dataRows = jsonData.slice(1);
        
        // Convert to object format
        const parsedData = dataRows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        resolve({
          data: parsedData,
          headers,
          rowCount: parsedData.length,
          format: 'EXCEL',
          sheets: workbook.SheetNames
        });
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
};

// JSON Parser
const parseJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        
        let data;
        if (Array.isArray(jsonData)) {
          data = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          data = jsonData.data;
        } else {
          // Convert single object to array
          data = [jsonData];
        }
        
        if (data.length === 0) {
          reject(new Error('JSON file contains no data'));
          return;
        }
        
        // Extract headers from first object
        const headers = Object.keys(data[0]);
        
        resolve({
          data,
          headers,
          rowCount: data.length,
          format: 'JSON'
        });
      } catch (error) {
        reject(new Error(`JSON parsing error: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read JSON file'));
    reader.readAsText(file);
  });
};

// XML Parser
const parseXMLFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      parseXML(e.target.result, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`XML parsing error: ${err.message}`));
          return;
        }
        
        try {
          // Try to find array data in XML structure
          let data = [];
          
          // Common XML structures
          const findArrayData = (obj, path = '') => {
            if (Array.isArray(obj)) {
              return obj;
            }
            
            for (const [key, value] of Object.entries(obj)) {
              if (Array.isArray(value)) {
                return value;
              }
              if (typeof value === 'object' && value !== null) {
                const found = findArrayData(value, `${path}.${key}`);
                if (found) return found;
              }
            }
            return null;
          };
          
          data = findArrayData(result);
          
          if (!data || data.length === 0) {
            reject(new Error('No tabular data found in XML file'));
            return;
          }
          
          // Flatten objects and extract headers
          const flattenedData = data.map(item => {
            const flattened = {};
            const flatten = (obj, prefix = '') => {
              for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}_${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  flatten(value, newKey);
                } else {
                  flattened[newKey] = value;
                }
              }
            };
            flatten(item);
            return flattened;
          });
          
          const headers = Object.keys(flattenedData[0] || {});
          
          resolve({
            data: flattenedData,
            headers,
            rowCount: flattenedData.length,
            format: 'XML'
          });
        } catch (error) {
          reject(new Error(`XML processing error: ${error.message}`));
        }
      });
    };
    
    reader.onerror = () => reject(new Error('Failed to read XML file'));
    reader.readAsText(file);
  });
};

// Text file parser with auto-delimiter detection
const parseText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n').slice(0, 10); // Sample first 10 lines
        
        // Detect delimiter
        const delimiters = [',', '\t', ';', '|', ' '];
        let bestDelimiter = ',';
        let maxColumns = 0;
        
        delimiters.forEach(delimiter => {
          const columns = lines[0]?.split(delimiter).length || 0;
          if (columns > maxColumns) {
            maxColumns = columns;
            bestDelimiter = delimiter;
          }
        });
        
        // Parse with detected delimiter
        Papa.parse(file, {
          header: true,
          delimiter: bestDelimiter,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`Text parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
              return;
            }
            
            resolve({
              data: results.data,
              headers: results.meta.fields,
              rowCount: results.data.length,
              format: 'TXT',
              detectedDelimiter: bestDelimiter
            });
          },
          error: (error) => reject(error)
        });
      } catch (error) {
        reject(new Error(`Text file processing error: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

// Main parser function
export const parseFile = async (file, format = null) => {
  const detectedFormat = format || detectFileFormat(file);
  
  if (!detectedFormat) {
    throw new Error('Unsupported file format');
  }
  
  const parsers = {
    CSV: parseCSV,
    TSV: parseTSV,
    EXCEL: parseExcel,
    JSON: parseJSON,
    XML: parseXMLFile,
    TXT: parseText
  };
  
  const parser = parsers[detectedFormat];
  if (!parser) {
    throw new Error(`No parser available for format: ${detectedFormat}`);
  }
  
  try {
    const result = await parser(file);
    
    // Add column analysis
    result.columnAnalysis = analyzeColumns(result.data);
    result.detectedFormat = detectedFormat;
    result.isPremiumFormat = SUPPORTED_FORMATS[detectedFormat].isPremium;
    
    return result;
  } catch (error) {
    throw new Error(`Failed to parse ${detectedFormat} file: ${error.message}`);
  }
};

// Google Sheets parser (URL-based)
export const parseGoogleSheets = async (url) => {
  try {
    // Convert Google Sheets URL to CSV export URL
    const csvUrl = url.replace('/edit#gid=', '/export?format=csv&gid=')
                     .replace('/edit', '/export?format=csv');
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Google Sheets data');
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`Google Sheets parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
            return;
          }
          
          const result = {
            data: results.data,
            headers: results.meta.fields,
            rowCount: results.data.length,
            format: 'GOOGLE_SHEETS',
            isPremiumFormat: true
          };
          
          result.columnAnalysis = analyzeColumns(result.data);
          resolve(result);
        },
        error: (error) => reject(error)
      });
    });
  } catch (error) {
    throw new Error(`Google Sheets parsing error: ${error.message}`);
  }
};
