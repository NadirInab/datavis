import React from 'react';
import { Icons } from '../ui/Button';

const ChartTypeSelector = ({ selectedType, onTypeChange, className = '' }) => {
  const chartTypes = [
    {
      id: 'bar',
      name: 'Bar Chart',
      description: 'Compare values across categories',
      icon: Icons.BarChart,
      color: 'from-blue-500 to-blue-600',
      recommended: ['categorical', 'comparison']
    },
    {
      id: 'line',
      name: 'Line Chart',
      description: 'Show trends over time',
      icon: Icons.TrendingUp,
      color: 'from-green-500 to-green-600',
      recommended: ['time-series', 'trends']
    },
    {
      id: 'pie',
      name: 'Pie Chart',
      description: 'Show parts of a whole',
      icon: Icons.PieChart,
      color: 'from-purple-500 to-purple-600',
      recommended: ['proportions', 'percentages']
    },
    {
      id: 'area',
      name: 'Area Chart',
      description: 'Show cumulative values over time',
      icon: Icons.Activity,
      color: 'from-indigo-500 to-indigo-600',
      recommended: ['cumulative', 'volume']
    },
    {
      id: 'radar',
      name: 'Radar Chart',
      description: 'Compare multiple variables',
      icon: Icons.Target,
      color: 'from-orange-500 to-orange-600',
      recommended: ['multi-dimensional', 'performance']
    },
    {
      id: 'bubble',
      name: 'Bubble Chart',
      description: 'Show relationships between 3 variables',
      icon: Icons.Circle,
      color: 'from-pink-500 to-pink-600',
      recommended: ['correlation', 'three-dimensional']
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-[#5A827E] mb-2">Choose Chart Type</h3>
        <p className="text-sm text-[#5A827E]/70 mb-4">
          Select the visualization that best represents your data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartTypes.map((chart) => {
          const IconComponent = chart.icon;
          const isSelected = selectedType === chart.id;
          
          return (
            <button
              key={chart.id}
              onClick={() => onTypeChange(chart.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                hover:shadow-lg hover:scale-105 group
                ${isSelected 
                  ? 'border-[#84AE92] bg-[#B9D4AA]/20 shadow-md' 
                  : 'border-[#84AE92]/30 bg-white hover:border-[#84AE92]/60'
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-[#84AE92] rounded-full flex items-center justify-center">
                  <Icons.Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={`
                w-12 h-12 rounded-lg bg-gradient-to-br ${chart.color} 
                flex items-center justify-center mb-3 group-hover:scale-110 transition-transform
              `}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <div>
                <h4 className="font-semibold text-[#5A827E] mb-1">{chart.name}</h4>
                <p className="text-sm text-[#5A827E]/70 mb-2">{chart.description}</p>
                
                {/* Recommended Use Cases */}
                <div className="flex flex-wrap gap-1">
                  {chart.recommended.map((use, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-[#FAFFCA]/60 text-[#5A827E] rounded-full"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hover Effect */}
              <div className={`
                absolute inset-0 rounded-xl bg-gradient-to-br ${chart.color} opacity-0 
                group-hover:opacity-5 transition-opacity pointer-events-none
              `} />
            </button>
          );
        })}
      </div>

      {/* Selected Chart Info */}
      {selectedType && (
        <div className="mt-6 p-4 bg-[#B9D4AA]/20 rounded-lg border border-[#84AE92]/30">
          <div className="flex items-center space-x-3">
            {(() => {
              const selectedChart = chartTypes.find(chart => chart.id === selectedType);
              const IconComponent = selectedChart?.icon;
              return (
                <>
                  <div className={`
                    w-8 h-8 rounded-lg bg-gradient-to-br ${selectedChart?.color} 
                    flex items-center justify-center
                  `}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#5A827E]">
                      {selectedChart?.name} Selected
                    </h4>
                    <p className="text-sm text-[#5A827E]/70">
                      {selectedChart?.description}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartTypeSelector;
