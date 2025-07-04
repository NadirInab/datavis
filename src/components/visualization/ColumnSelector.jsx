import React, { useState, useMemo } from 'react';
import { Icons } from '../ui/Button';

const ColumnSelector = ({ 
  label, 
  value, 
  onChange, 
  columns = [], 
  columnTypes = {},
  placeholder = "Select column",
  description,
  allowedTypes = ['all'],
  showPreview = true,
  required = false,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter columns based on allowed types and search term
  const filteredColumns = useMemo(() => {
    let filtered = columns;

    // Filter by allowed types
    if (allowedTypes.length > 0 && !allowedTypes.includes('all')) {
      filtered = columns.filter(col => {
        const type = columnTypes[col];
        return allowedTypes.includes(type);
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(col =>
        col.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [columns, columnTypes, allowedTypes, searchTerm]);

  const getColumnTypeIcon = (type) => {
    switch (type) {
      case 'numeric':
        return Icons.Hash;
      case 'date':
        return Icons.Calendar;
      case 'text':
      case 'category':
        return Icons.Type;
      default:
        return Icons.Database;
    }
  };

  const getColumnTypeColor = (type) => {
    switch (type) {
      case 'numeric':
        return 'text-blue-600 bg-blue-50';
      case 'date':
        return 'text-green-600 bg-green-50';
      case 'text':
      case 'category':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const selectedColumn = columns.find(col => col === value);
  const selectedType = selectedColumn ? columnTypes[selectedColumn] : null;

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-[#5A827E]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Description */}
      {description && (
        <p className="text-sm text-[#5A827E]/70">{description}</p>
      )}

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-3 py-2 text-left bg-white border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-[#84AE92] focus:border-[#84AE92]
            transition-colors duration-200
            ${error ? 'border-red-300' : 'border-[#84AE92]/30 hover:border-[#84AE92]/60'}
            ${isOpen ? 'ring-2 ring-[#84AE92] border-[#84AE92]' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedColumn ? (
                <>
                  {(() => {
                    const IconComponent = getColumnTypeIcon(selectedType);
                    return (
                      <div className={`p-1 rounded ${getColumnTypeColor(selectedType)}`}>
                        <IconComponent className="w-3 h-3" />
                      </div>
                    );
                  })()}
                  <span className="text-[#5A827E]">{selectedColumn}</span>
                  <span className="text-xs text-[#5A827E]/60 capitalize">
                    ({selectedType})
                  </span>
                </>
              ) : (
                <span className="text-[#5A827E]/60">{placeholder}</span>
              )}
            </div>
            <Icons.ChevronDown className={`w-4 h-4 text-[#5A827E]/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute z-20 w-full mt-1 bg-white border border-[#84AE92]/30 rounded-lg shadow-lg max-h-64 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-[#84AE92]/20">
                <div className="relative">
                  <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5A827E]/60" />
                  <input
                    type="text"
                    placeholder="Search columns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#84AE92]/30 rounded-md focus:outline-none focus:ring-1 focus:ring-[#84AE92]"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="max-h-48 overflow-y-auto">
                {filteredColumns.length > 0 ? (
                  filteredColumns.map((column) => {
                    const type = columnTypes[column];
                    const IconComponent = getColumnTypeIcon(type);
                    const isSelected = column === value;
                    
                    return (
                      <button
                        key={column}
                        onClick={() => {
                          onChange(column);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={`
                          w-full px-3 py-2 text-left hover:bg-[#B9D4AA]/20 
                          transition-colors duration-150 flex items-center space-x-3
                          ${isSelected ? 'bg-[#B9D4AA]/30 text-[#5A827E]' : 'text-[#5A827E]'}
                        `}
                      >
                        <div className={`p-1 rounded ${getColumnTypeColor(type)}`}>
                          <IconComponent className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{column}</div>
                          <div className="text-xs text-[#5A827E]/60 capitalize">
                            {type} column
                          </div>
                        </div>
                        {isSelected && (
                          <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-center text-[#5A827E]/60">
                    {searchTerm ? 'No columns match your search' : 'No columns available'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <Icons.AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </p>
      )}

      {/* Preview */}
      {showPreview && selectedColumn && (
        <div className="mt-2 p-3 bg-[#FAFFCA]/30 rounded-lg border border-[#84AE92]/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-[#5A827E]">Column Preview</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${getColumnTypeColor(selectedType)}`}>
              {selectedType}
            </span>
          </div>
          <div className="text-sm text-[#5A827E]/70">
            <strong>{selectedColumn}</strong> - This column contains {selectedType} data
            {selectedType === 'numeric' && ' suitable for calculations and aggregations'}
            {selectedType === 'date' && ' suitable for time-based analysis'}
            {(selectedType === 'text' || selectedType === 'category') && ' suitable for grouping and categorization'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;
