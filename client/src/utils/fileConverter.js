// File Conversion Utilities
import Papa from 'papaparse';

// Supported conversion formats with metadata
export const CONVERSION_FORMATS = {
  CSV: {
    id: 'csv',
    name: 'CSV',
    icon: '📊',
    description: 'Comma-Separated Values',
    extension: '.csv',
    mimeType: 'text/csv',
    category: 'data'
  },
  TSV: {
    id: 'tsv',
    name: 'TSV',
    icon: '📋',
    description: 'Tab-Separated Values',
    extension: '.tsv',
    mimeType: 'text/tab-separated-values',
    category: 'data'
  },
  HTML: {
    id: 'html',
    name: 'HTML',
    icon: '🌐',
    description: 'HTML Table',
    extension: '.html',
    mimeType: 'text/html',
    category: 'web'
  },
  EXCEL: {
    id: 'excel',
    name: 'Excel',
    icon: '📈',
    description: 'Microsoft Excel Workbook',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'office'
  },
  MARKDOWN: {
    id: 'markdown',
    name: 'Markdown',
    icon: '📝',
    description: 'Markdown Table',
    extension: '.md',
    mimeType: 'text/markdown',
    category: 'document'
  },
  LATEX: {
    id: 'latex',
    name: 'LaTeX',
    icon: '📄',
    description: 'LaTeX Table',
    extension: '.tex',
    mimeType: 'application/x-latex',
    category: 'document'
  },
  SQL: {
    id: 'sql',
    name: 'SQL',
    icon: '🗄️',
    description: 'SQL Insert Statements',
    extension: '.sql',
    mimeType: 'application/sql',
    category: 'database'
  },
  JSON: {
    id: 'json',
    name: 'JSON',
    icon: '🔧',
    description: 'JavaScript Object Notation',
    extension: '.json',
    mimeType: 'application/json',
    category: 'data'
  },
  YAML: {
    id: 'yaml',
    name: 'YAML',
    icon: '⚙️',
    description: 'YAML Ain\'t Markup Language',
    extension: '.yaml',
    mimeType: 'application/x-yaml',
    category: 'config'
  },
  XML: {
    id: 'xml',
    name: 'XML',
    icon: '📰',
    description: 'Extensible Markup Language',
    extension: '.xml',
    mimeType: 'application/xml',
    category: 'data'
  }
};

// Get conversion formats by category
export const getFormatsByCategory = () => {
  const categories = {};
  Object.values(CONVERSION_FORMATS).forEach(format => {
    if (!categories[format.category]) {
      categories[format.category] = [];
    }
    categories[format.category].push(format);
  });
  return categories;
};

// Client-side conversion functions (for immediate preview/download)
export const convertData = {
  // Convert to CSV
  toCSV: (data, options = {}) => {
    const { delimiter = ',', header = true } = options;
    return Papa.unparse(data, {
      delimiter,
      header,
      skipEmptyLines: true
    });
  },

  // Convert to TSV
  toTSV: (data, options = {}) => {
    return convertData.toCSV(data, { ...options, delimiter: '\t' });
  },

  // Convert to HTML Table
  toHTML: (data, options = {}) => {
    const { 
      title = 'Data Table',
      className = 'data-table',
      includeStyles = true 
    } = options;

    if (!Array.isArray(data) || data.length === 0) {
      return '<p>No data available</p>';
    }

    const headers = Object.keys(data[0]);
    const styles = includeStyles ? `
      <style>
        .${className} {
          border-collapse: collapse;
          width: 100%;
          margin: 20px 0;
          font-family: Arial, sans-serif;
        }
        .${className} th, .${className} td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .${className} th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .${className} tr:nth-child(even) {
          background-color: #f9f9f9;
        }
      </style>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        ${styles}
      </head>
      <body>
        <h1>${title}</h1>
        <table class="${className}">
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return html;
  },

  // Convert to Markdown Table
  toMarkdown: (data, options = {}) => {
    if (!Array.isArray(data) || data.length === 0) {
      return '| No data available |\n|---|\n';
    }

    const headers = Object.keys(data[0]);
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
    
    const dataRows = data.map(row => 
      `| ${headers.map(header => row[header] || '').join(' | ')} |`
    );

    return [headerRow, separatorRow, ...dataRows].join('\n');
  },

  // Convert to LaTeX Table
  toLaTeX: (data, options = {}) => {
    const { caption = 'Data Table', label = 'tab:data' } = options;

    if (!Array.isArray(data) || data.length === 0) {
      return '\\begin{table}[h]\n\\caption{No data available}\n\\end{table}';
    }

    const headers = Object.keys(data[0]);
    const columnSpec = 'l'.repeat(headers.length);

    const headerRow = headers.join(' & ') + ' \\\\';
    const dataRows = data.map(row => 
      headers.map(header => row[header] || '').join(' & ') + ' \\\\'
    );

    return `
\\begin{table}[h]
\\centering
\\begin{tabular}{${columnSpec}}
\\hline
${headerRow}
\\hline
${dataRows.join('\n')}
\\hline
\\end{tabular}
\\caption{${caption}}
\\label{${label}}
\\end{table}
    `.trim();
  },

  // Convert to SQL Insert Statements
  toSQL: (data, options = {}) => {
    const { tableName = 'data_table', includeCreateTable = true } = options;

    if (!Array.isArray(data) || data.length === 0) {
      return '-- No data available';
    }

    const headers = Object.keys(data[0]);
    let sql = '';

    if (includeCreateTable) {
      const columns = headers.map(header => `  ${header} VARCHAR(255)`).join(',\n');
      sql += `CREATE TABLE ${tableName} (\n${columns}\n);\n\n`;
    }

    const insertStatements = data.map(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `'${value.toString().replace(/'/g, "''")}'`;
      }).join(', ');
      return `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values});`;
    });

    sql += insertStatements.join('\n');
    return sql;
  },

  // Convert to JSON
  toJSON: (data, options = {}) => {
    const { pretty = true } = options;
    return JSON.stringify(data, null, pretty ? 2 : 0);
  },

  // Convert to YAML
  toYAML: (data, options = {}) => {
    // Simple YAML conversion (for complex YAML, use a proper library)
    const yamlString = data.map((item, index) => {
      const itemYaml = Object.entries(item)
        .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
        .join('\n');
      return `- # Item ${index + 1}\n${itemYaml}`;
    }).join('\n');

    return yamlString;
  },

  // Convert to XML
  toXML: (data, options = {}) => {
    const { rootElement = 'data', itemElement = 'item' } = options;

    if (!Array.isArray(data) || data.length === 0) {
      return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}></${rootElement}>`;
    }

    const xmlItems = data.map(item => {
      const fields = Object.entries(item)
        .map(([key, value]) => `    <${key}>${value || ''}</${key}>`)
        .join('\n');
      return `  <${itemElement}>\n${fields}\n  </${itemElement}>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<${rootElement}>
${xmlItems}
</${rootElement}>`;
  }
};

// Download converted file
export const downloadConvertedFile = (content, filename, format) => {
  const formatInfo = Object.values(CONVERSION_FORMATS).find(f => f.id === format);
  const mimeType = formatInfo?.mimeType || 'text/plain';
  const extension = formatInfo?.extension || '.txt';
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  CONVERSION_FORMATS,
  getFormatsByCategory,
  convertData,
  downloadConvertedFile
};
