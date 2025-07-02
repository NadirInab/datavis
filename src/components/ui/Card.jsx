import React from 'react';

// Base Card component
const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'md',
  shadow = 'soft',
  rounded = 'xl',
  background = 'white',
  border = true,
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-2xl',
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary-50',
    secondary: 'bg-secondary-50',
    accent: 'bg-accent-50',
    highlight: 'bg-highlight-50',
  };

  const hoverClasses = hover ? 'hover:shadow-medium hover:-translate-y-1 transition-all duration-200 cursor-pointer' : '';
  const borderClasses = border ? 'border border-gray-100' : '';

  return (
    <div
      className={`
        ${backgroundClasses[background]}
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${roundedClasses[rounded]}
        ${borderClasses}
        ${hoverClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// Stats Card component
export const StatsCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: IconComponent,
  color = 'primary',
  className = '' 
}) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-500 text-white',
      text: 'text-primary-600',
    },
    secondary: {
      bg: 'bg-secondary-50',
      icon: 'bg-secondary-500 text-white',
      text: 'text-secondary-600',
    },
    accent: {
      bg: 'bg-accent-50',
      icon: 'bg-accent-500 text-white',
      text: 'text-accent-600',
    },
    success: {
      bg: 'bg-green-50',
      icon: 'bg-green-500 text-white',
      text: 'text-green-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-500 text-white',
      text: 'text-yellow-600',
    },
    danger: {
      bg: 'bg-red-50',
      icon: 'bg-red-500 text-white',
      text: 'text-red-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <Card className={`${colors.bg} border-0 hover:shadow-lg transition-all duration-200 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {IconComponent && (
            <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
              <IconComponent />
            </div>
          )}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {trend === 'up' && (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {trend === 'down' && (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="sr-only">{trend === 'up' ? 'Increased' : 'Decreased'} by</span>
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </Card>
  );
};

// Feature Card component
export const FeatureCard = ({ 
  icon: IconComponent, 
  title, 
  description, 
  action,
  className = '' 
}) => (
  <Card hover className={`text-center group ${className}`}>
    <div className="flex flex-col items-center">
      {IconComponent && (
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-200">
          <IconComponent />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  </Card>
);

// File Card component
export const FileCard = ({ 
  file, 
  onView, 
  onEdit, 
  onDelete, 
  onExport,
  className = '' 
}) => (
  <Card hover className={`group ${className}`}>
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{file.name}</h4>
        <div className="flex items-center space-x-4 mt-1">
          <span className="text-xs text-gray-500">{file.rows} rows</span>
          <span className="text-xs text-gray-500">{file.columns} columns</span>
          <span className="text-xs text-gray-500">{file.size}</span>
        </div>
      </div>
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex space-x-1">
          {onView && (
            <button
              onClick={() => onView(file)}
              className="p-2 text-gray-400 hover:text-primary-500 transition-colors duration-200"
              title="View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(file)}
              className="p-2 text-gray-400 hover:text-secondary-500 transition-colors duration-200"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onExport && (
            <button
              onClick={() => onExport(file)}
              className="p-2 text-gray-400 hover:text-accent-500 transition-colors duration-200"
              title="Export"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(file)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  </Card>
);

// Chart Card component
export const ChartCard = ({ 
  title, 
  description, 
  children, 
  actions,
  className = '' 
}) => (
  <Card className={`${className}`}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex space-x-2">{actions}</div>}
    </div>
    <div className="relative">
      {children}
    </div>
  </Card>
);

export default Card;
