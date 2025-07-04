import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Export chart as PNG
export const exportChartAsPNG = async (elementId, filename = 'chart') => {
  try {
    console.log('PNG Export: Starting for element', elementId);

    if (!elementId) {
      throw new Error('Chart element ID is required');
    }

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Chart element not found: ${elementId}`);
    }

    console.log('PNG Export: Element found', element);

    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas library not loaded');
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      logging: false // Disable html2canvas logging
    });

    console.log('PNG Export: Canvas created', canvas.width, 'x', canvas.height);

    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('PNG Export: Download triggered');
    return true;
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
    throw error;
  }
};

// Export chart as PDF
export const exportChartAsPDF = async (elementId, filename = 'chart') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Chart element not found');
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${filename}.pdf`);

    return true;
  } catch (error) {
    console.error('Error exporting chart as PDF:', error);
    throw error;
  }
};

// Export data as CSV
export const exportDataAsCSV = (data, filename = 'data') => {
  try {
    console.log('CSV Export: Starting with data', data?.length, 'rows');

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    console.log('CSV Export: Headers', headers);

    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle null/undefined values
          if (value === null || value === undefined) {
            return '';
          }
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    console.log('CSV Export: Content created, size:', csvContent.length);

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL
    setTimeout(() => URL.revokeObjectURL(link.href), 100);

    console.log('CSV Export: Download triggered');
    return true;
  } catch (error) {
    console.error('Error exporting data as CSV:', error);
    throw error;
  }
};

// Export data as JSON
export const exportDataAsJSON = (data, filename = 'data') => {
  try {
    console.log('JSON Export: Starting with data', data?.length || 'unknown', 'items');

    if (!data) {
      throw new Error('No data to export');
    }

    const jsonContent = JSON.stringify(data, null, 2);
    console.log('JSON Export: Content created, size:', jsonContent.length);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL
    setTimeout(() => URL.revokeObjectURL(link.href), 100);

    console.log('JSON Export: Download triggered');
    return true;
  } catch (error) {
    console.error('Error exporting data as JSON:', error);
    throw error;
  }
};

// Export visualization configuration
export const exportVisualizationConfig = (visualization, filename = 'visualization-config') => {
  try {
    if (!visualization) {
      throw new Error('No visualization configuration to export');
    }

    const config = {
      type: visualization.type || 'unknown',
      title: visualization.title || 'Untitled Visualization',
      columns: visualization.columns || [],
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return exportDataAsJSON(config, filename);
  } catch (error) {
    console.error('Error exporting visualization config:', error);
    throw error;
  }
};

// Batch export multiple charts
export const batchExportCharts = async (chartElements, format = 'png', filename = 'charts') => {
  try {
    const results = [];
    
    for (let i = 0; i < chartElements.length; i++) {
      const element = chartElements[i];
      const chartFilename = `${filename}_${i + 1}`;
      
      if (format === 'png') {
        await exportChartAsPNG(element.id, chartFilename);
      } else if (format === 'pdf') {
        await exportChartAsPDF(element.id, chartFilename);
      }
      
      results.push({ element: element.id, success: true });
    }
    
    return results;
  } catch (error) {
    console.error('Error in batch export:', error);
    throw error;
  }
};

// Get export options based on subscription tier
export const getExportOptions = (subscriptionTier) => {
  const baseOptions = ['png', 'csv', 'json'];
  
  switch (subscriptionTier) {
    case 'enterprise':
      return [...baseOptions, 'pdf', 'batch', 'config'];
    case 'pro':
      return [...baseOptions, 'pdf'];
    case 'free':
    default:
      return baseOptions;
  }
};

// Validate export permissions
export const canExport = (subscriptionTier, exportType) => {
  const allowedExports = getExportOptions(subscriptionTier);
  return allowedExports.includes(exportType);
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate export summary
export const generateExportSummary = (data, visualizations) => {
  // Ensure data and visualizations are arrays
  const safeData = Array.isArray(data) ? data : [];
  const safeVisualizations = Array.isArray(visualizations) ? visualizations : [];

  // Calculate data size safely
  const dataSize = safeData.length > 0 ? JSON.stringify(safeData).length : 0;

  return {
    dataRows: safeData.length,
    dataColumns: safeData.length > 0 ? Object.keys(safeData[0]).length : 0,
    visualizations: safeVisualizations.length,
    exportedAt: new Date().toISOString(),
    estimatedFileSize: {
      csv: Math.round(dataSize * 0.7), // CSV is typically smaller
      json: dataSize,
      png: '~500KB per chart',
      pdf: '~200KB per chart'
    }
  };
};

