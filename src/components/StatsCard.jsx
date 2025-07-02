import React from 'react';

const StatsCard = ({ title, value, change, trend, icon, color = 'primary' }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-br from-[#5A827E]/10 to-[#5A827E]/20',
      icon: 'bg-gradient-to-br from-[#5A827E] to-[#5A827E]/90',
      border: 'border-[#5A827E]/20',
      text: 'text-[#5A827E]',
    },
    secondary: {
      bg: 'bg-gradient-to-br from-[#84AE92]/10 to-[#84AE92]/20',
      icon: 'bg-gradient-to-br from-[#84AE92] to-[#84AE92]/90',
      border: 'border-[#84AE92]/20',
      text: 'text-[#84AE92]',
    },
    accent: {
      bg: 'bg-gradient-to-br from-[#B9D4AA]/10 to-[#B9D4AA]/20',
      icon: 'bg-gradient-to-br from-[#B9D4AA] to-[#B9D4AA]/90',
      border: 'border-[#B9D4AA]/20',
      text: 'text-[#B9D4AA]',
    },
    success: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      icon: 'bg-gradient-to-br from-green-500 to-green-600',
      border: 'border-green-200',
      text: 'text-green-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border ${colors.border} hover:shadow-md transition-all duration-300 hover:-translate-y-1 group`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-medium text-[#5A827E]/70">{title}</h3>
        <span className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colors.icon} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-6 sm:w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={icon.path}
            />
          </svg>
        </span>
      </div>
      <div className="flex flex-col">
        <span className={`text-2xl sm:text-3xl font-bold ${colors.text} group-hover:opacity-80 transition-opacity duration-200`}>
          {value}
        </span>
        {change && (
          <div className="flex items-center mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#5A827E]/10">
            <span className={`text-xs sm:text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={trend === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
                />
              </svg>
              {change}
            </span>
            <span className="text-xs text-[#5A827E]/50 ml-2 hidden sm:inline">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;