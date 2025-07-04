import React, { useState, useMemo } from 'react';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';
import ChartTypeSelector from './ChartTypeSelector';
import ColumnSelector from './ColumnSelector';

const VisualizationCreator = ({ 
  file, 
  onCreateVisualization, 
  onCancel,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    type: 'bar',
    title: '',
    columns: {}
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Chart Type, 2: Configuration, 3: Preview

  // Normalize column type to handle different formats
  const normalizeColumnType = (type) => {
    if (typeof type === 'object' && type.dataType) {
      return type.dataType;
    }
    return type;
  };

  // Map file parser types to expected types
  const mapColumnType = (type) => {
    const normalizedType = normalizeColumnType(type);
    
    const typeMapping = {
      'text': 'text',
      'integer': 'numeric',
      'decimal': 'numeric',
      'date': 'date',
      'boolean': 'text',
      'string': 'text',
      'numeric': 'numeric',
      'category': 'text',
      'null': 'text'
    };
    
    return typeMapping[normalizedType] || 'text';
  };

  // Get column options based on their data types
  const columnOptions = useMemo(() => {
    if (!file || !file.columnTypes) return { numeric: [], category: [], date: [], all: [] };
    
    const numeric = [];
    const category = [];
    const date = [];
    const all = [];
    
    Object.entries(file.columnTypes).forEach(([column, type]) => {
      all.push(column);
      const mappedType = mapColumnType(type);
      
      if (mappedType === 'numeric') {
        numeric.push(column);
      } else if (mappedType === 'date') {
        date.push(column);
      } else if (mappedType !== 'null') {
        category.push(column);
      }
    });
    
    return { numeric, category, date, all };
  }, [file]);

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber >= 1) {
      if (!formData.type) {
        newErrors.type = 'Please select a chart type';
      }
    }
    
    if (stepNumber >= 2) {
      if (!formData.title.trim()) {
        newErrors.title = 'Please enter a title for your visualization';
      }
      
      // Validate columns based on chart type
      if (formData.type === 'pie') {
        if (!formData.columns.name) {
          newErrors.categoryColumn = 'Please select a category column';
        }
        if (!formData.columns.value) {
          newErrors.valueColumn = 'Please select a value column';
        }
      } else if (['bar', 'line', 'area'].includes(formData.type)) {
        if (!formData.columns.x) {
          newErrors.xColumn = 'Please select an X-axis column';
        }
        if (!formData.columns.y) {
          newErrors.yColumn = 'Please select a Y-axis column';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = () => {
    if (validateStep(2)) {
      onCreateVisualization(formData);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updateColumns = (field, value) => {
    setFormData(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [field]: value
      }
    }));
    
    // Clear related errors
    const errorField = field === 'name' ? 'categoryColumn' : 
                      field === 'value' ? 'valueColumn' :
                      field === 'x' ? 'xColumn' :
                      field === 'y' ? 'yColumn' : field;
    
    if (errors[errorField]) {
      setErrors(prev => ({ ...prev, [errorField]: null }));
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Choose Chart Type';
      case 2: return 'Configure Your Chart';
      case 3: return 'Preview & Create';
      default: return 'Create Visualization';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Select the type of chart that best represents your data';
      case 2: return 'Configure the data columns and chart settings';
      case 3: return 'Review your settings and create the visualization';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#5A827E]">{getStepTitle()}</h2>
              <p className="text-[#5A827E]/70 mt-1">{getStepDescription()}</p>
            </div>
            <Button
              onClick={onCancel}
              variant="ghost"
              icon={Icons.X}
              className="text-[#5A827E]/60 hover:text-[#5A827E]"
            >
              Cancel
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNum 
                    ? 'bg-[#84AE92] text-white' 
                    : 'bg-[#84AE92]/20 text-[#5A827E]/60'
                  }
                `}>
                  {step > stepNum ? (
                    <Icons.Check className="w-4 h-4" />
                  ) : (
                    stepNum
                  )}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-[#84AE92]' : 'bg-[#84AE92]/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Chart Type Selection */}
          {step === 1 && (
            <ChartTypeSelector
              selectedType={formData.type}
              onTypeChange={(type) => updateFormData('type', type)}
            />
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-[#5A827E] mb-2">
                  Chart Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter a descriptive title for your chart"
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84AE92]
                    ${errors.title ? 'border-red-300' : 'border-[#84AE92]/30'}
                  `}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Column Configuration */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[#5A827E]">Data Configuration</h3>
                
                {/* Pie Chart Configuration */}
                {formData.type === 'pie' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColumnSelector
                      label="Category Column"
                      description="Column containing the categories to display"
                      value={formData.columns.name || ''}
                      onChange={(value) => updateColumns('name', value)}
                      columns={columnOptions.category}
                      columnTypes={file.columnTypes}
                      allowedTypes={['text', 'category']}
                      required
                      error={errors.categoryColumn}
                    />
                    
                    <ColumnSelector
                      label="Value Column"
                      description="Column containing the values to measure"
                      value={formData.columns.value || ''}
                      onChange={(value) => updateColumns('value', value)}
                      columns={['count', ...columnOptions.numeric]}
                      columnTypes={{ count: 'numeric', ...file.columnTypes }}
                      allowedTypes={['numeric']}
                      required
                      error={errors.valueColumn}
                    />
                  </div>
                )}

                {/* Bar/Line/Area Chart Configuration */}
                {['bar', 'line', 'area'].includes(formData.type) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColumnSelector
                      label="X-Axis Column *"
                      description="Column for the horizontal axis"
                      value={formData.columns.x || ''}
                      onChange={(value) => updateColumns('x', value)}
                      columns={[...columnOptions.category, ...columnOptions.date]}
                      columnTypes={file.columnTypes}
                      allowedTypes={['text', 'category', 'date']}
                      required
                      error={errors.xColumn}
                    />
                    
                    <ColumnSelector
                      label="Y-Axis Column *"
                      description="Column for the vertical axis"
                      value={formData.columns.y || ''}
                      onChange={(value) => updateColumns('y', value)}
                      columns={columnOptions.numeric}
                      columnTypes={file.columnTypes}
                      allowedTypes={['numeric']}
                      required
                      error={errors.yColumn}
                    />
                  </div>
                )}

                {/* Radar Chart Configuration */}
                {formData.type === 'radar' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColumnSelector
                      label="Subject Column"
                      description="Column containing the subjects to compare"
                      value={formData.columns.subject || ''}
                      onChange={(value) => updateColumns('subject', value)}
                      columns={columnOptions.category}
                      columnTypes={file.columnTypes}
                      allowedTypes={['text', 'category']}
                      required
                      error={errors.subjectColumn}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-[#5A827E] mb-2">
                        Metrics Columns *
                      </label>
                      <p className="text-sm text-[#5A827E]/70 mb-2">
                        Select multiple numeric columns to compare
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {columnOptions.numeric.map(column => (
                          <label key={column} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.columns.metrics?.includes(column) || false}
                              onChange={(e) => {
                                const currentMetrics = formData.columns.metrics || [];
                                if (e.target.checked) {
                                  updateColumns('metrics', [...currentMetrics, column]);
                                } else {
                                  updateColumns('metrics', currentMetrics.filter(m => m !== column));
                                }
                              }}
                              className="rounded border-[#84AE92]/30 text-[#84AE92] focus:ring-[#84AE92]"
                            />
                            <span className="text-sm text-[#5A827E]">{column}</span>
                          </label>
                        ))}
                      </div>
                      {errors.metricsColumn && (
                        <p className="mt-1 text-sm text-red-600">{errors.metricsColumn}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bubble Chart Configuration */}
                {formData.type === 'bubble' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ColumnSelector
                      label="X-Axis Column"
                      description="Column for the horizontal axis"
                      value={formData.columns.x || ''}
                      onChange={(value) => updateColumns('x', value)}
                      columns={columnOptions.numeric}
                      columnTypes={file.columnTypes}
                      allowedTypes={['numeric']}
                      required
                      error={errors.xColumn}
                    />
                    
                    <ColumnSelector
                      label="Y-Axis Column"
                      description="Column for the vertical axis"
                      value={formData.columns.y || ''}
                      onChange={(value) => updateColumns('y', value)}
                      columns={columnOptions.numeric}
                      columnTypes={file.columnTypes}
                      allowedTypes={['numeric']}
                      required
                      error={errors.yColumn}
                    />

                    <ColumnSelector
                      label="Size Column"
                      description="Column for bubble size"
                      value={formData.columns.z || ''}
                      onChange={(value) => updateColumns('z', value)}
                      columns={columnOptions.numeric}
                      columnTypes={file.columnTypes}
                      allowedTypes={['numeric']}
                      required
                      error={errors.zColumn}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-[#FAFFCA]/30 rounded-lg p-6 border border-[#84AE92]/20">
                <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Visualization Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-[#5A827E]/70">Chart Type:</span>
                    <p className="font-medium text-[#5A827E] capitalize">{formData.type} Chart</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-[#5A827E]/70">Title:</span>
                    <p className="font-medium text-[#5A827E]">{formData.title}</p>
                  </div>
                  
                  {Object.entries(formData.columns).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-sm text-[#5A827E]/70 capitalize">
                        {key === 'name' ? 'Category' : 
                         key === 'value' ? 'Value' : 
                         key === 'subject' ? 'Subject' :
                         key === 'metrics' ? 'Metrics' :
                         key === 'z' ? 'Size' :
                         key}-Axis:
                      </span>
                      <p className="font-medium text-[#5A827E]">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Icons.Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Ready to Create</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your visualization will be created and added to this file. You can always edit or delete it later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-[#84AE92]/20">
          <div>
            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="ghost"
                icon={Icons.ArrowLeft}
                disabled={loading}
              >
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {step < 3 ? (
              <Button
                onClick={handleNext}
                variant="primary"
                icon={Icons.ArrowRight}
                iconPosition="right"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                variant="primary"
                icon={Icons.Plus}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Visualization'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VisualizationCreator;