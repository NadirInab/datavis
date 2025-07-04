import { hasFeatureAccess, trackFeatureUsage } from './featureGating';

// Chart export formats and their feature requirements
export const EXPORT_FORMATS = {
  PNG: {
    id: 'chart_export_png',
    name: 'PNG Image',
    extension: 'png',
    mimeType: 'image/png',
    description: 'High-quality raster image format'
  },
  JPG: {
    id: 'chart_export_jpg',
    name: 'JPG Image',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    description: 'Compressed image format'
  },
  PDF: {
    id: 'chart_export_pdf',
    name: 'PDF Document',
    extension: 'pdf',
    mimeType: 'application/pdf',
    description: 'Portable document format'
  },
  SVG: {
    id: 'chart_export_svg',
    name: 'SVG Vector',
    extension: 'svg',
    mimeType: 'image/svg+xml',
    description: 'Scalable vector graphics'
  }
};

// Check if user can export in specific format
export const canExportFormat = (user, formatId) => {
  const format = Object.values(EXPORT_FORMATS).find(f => f.id === formatId);
  if (!format) return false;
  
  return hasFeatureAccess(user, formatId);
};

// Get available export formats for user
export const getAvailableExportFormats = (user) => {
  return Object.values(EXPORT_FORMATS).filter(format => 
    hasFeatureAccess(user, format.id)
  );
};

// Export chart as image (PNG/JPG)
export const exportChartAsImage = async (chartElement, format = 'PNG', filename = 'chart') => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas from chart element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Get chart dimensions
      const rect = chartElement.getBoundingClientRect();
      canvas.width = rect.width * 2; // Higher resolution
      canvas.height = rect.height * 2;
      
      // Scale context for high DPI
      ctx.scale(2, 2);
      
      // Convert chart to image
      const svgData = new XMLSerializer().serializeToString(chartElement);
      const img = new Image();
      
      img.onload = () => {
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        
        // Convert to desired format
        const mimeType = EXPORT_FORMATS[format].mimeType;
        const dataURL = canvas.toDataURL(mimeType, 0.9);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${filename}.${EXPORT_FORMATS[format].extension}`;
        link.href = dataURL;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        resolve(dataURL);
      };
      
      img.onerror = () => reject(new Error('Failed to load chart image'));
      
      // Create blob URL for SVG
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Export chart as SVG
export const exportChartAsSVG = async (chartElement, filename = 'chart') => {
  try {
    // Get SVG content
    const svgData = new XMLSerializer().serializeToString(chartElement);
    
    // Create blob
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = URL.createObjectURL(blob);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return svgData;
  } catch (error) {
    throw new Error(`Failed to export SVG: ${error.message}`);
  }
};

// Export chart as PDF (using jsPDF)
export const exportChartAsPDF = async (chartElement, filename = 'chart') => {
  try {
    // Dynamic import of jsPDF to avoid bundle size issues
    const { jsPDF } = await import('jspdf');
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [chartElement.offsetWidth, chartElement.offsetHeight]
    });
    
    // Convert chart to image first
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const rect = chartElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(chartElement);
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, rect.width, rect.height);
        
        // Save PDF
        pdf.save(`${filename}.pdf`);
        resolve(pdf);
      };
      
      img.onerror = () => reject(new Error('Failed to convert chart to PDF'));
      
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
    });
    
  } catch (error) {
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

// Main export function with feature gating
export const exportChart = async (user, chartElement, format, filename = 'chart') => {
  // Check if user has access to this export format
  if (!canExportFormat(user, EXPORT_FORMATS[format].id)) {
    throw new Error(`You don't have access to ${format} export. Please upgrade your subscription.`);
  }
  
  // Track feature usage
  trackFeatureUsage(user, EXPORT_FORMATS[format].id);
  
  try {
    switch (format) {
      case 'PNG':
      case 'JPG':
        return await exportChartAsImage(chartElement, format, filename);
      case 'SVG':
        return await exportChartAsSVG(chartElement, filename);
      case 'PDF':
        return await exportChartAsPDF(chartElement, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
};

// Data export functions
export const exportDataAsCSV = (data, filename = 'data') => {
  try {
    // Convert data to CSV
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = `${filename}.csv`;
    link.href = URL.createObjectURL(blob);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return csvContent;
  } catch (error) {
    throw new Error(`Failed to export CSV: ${error.message}`);
  }
};

export const exportDataAsJSON = (data, filename = 'data') => {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${filename}.json`;
    link.href = URL.createObjectURL(blob);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return jsonContent;
  } catch (error) {
    throw new Error(`Failed to export JSON: ${error.message}`);
  }
};

export const exportDataAsExcel = async (data, filename = 'data') => {
  try {
    // Dynamic import of xlsx
    const XLSX = await import('xlsx');
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Save file
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return wb;
  } catch (error) {
    throw new Error(`Failed to export Excel: ${error.message}`);
  }
};

// Main data export function with feature gating
export const exportData = async (user, data, format, filename = 'data') => {
  const formatFeatureMap = {
    CSV: 'data_export_csv',
    JSON: 'data_export_json',
    EXCEL: 'data_export_excel'
  };
  
  const featureId = formatFeatureMap[format];
  if (!featureId || !hasFeatureAccess(user, featureId)) {
    throw new Error(`You don't have access to ${format} data export. Please upgrade your subscription.`);
  }
  
  // Track feature usage
  trackFeatureUsage(user, featureId);
  
  try {
    switch (format) {
      case 'CSV':
        return await exportDataAsCSV(data, filename);
      case 'JSON':
        return await exportDataAsJSON(data, filename);
      case 'EXCEL':
        return await exportDataAsExcel(data, filename);
      default:
        throw new Error(`Unsupported data export format: ${format}`);
    }
  } catch (error) {
    throw new Error(`Data export failed: ${error.message}`);
  }
};
