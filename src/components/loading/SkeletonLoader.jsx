import React from 'react';

// Base skeleton component
const Skeleton = ({ className = '', width = 'w-full', height = 'h-4', rounded = 'rounded' }) => (
  <div 
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${width} ${height} ${rounded} ${className}`}
    style={{
      animation: 'shimmer 1.5s ease-in-out infinite',
      backgroundImage: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
    }}
  />
);

// Table skeleton loader
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="animate-fade-in">
    <div className="bg-white shadow overflow-hidden rounded-lg">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="w-24" height="h-4" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  {colIndex === 0 ? (
                    <div className="flex items-center space-x-3">
                      <Skeleton width="w-10" height="h-10" rounded="rounded-full" />
                      <div className="space-y-2">
                        <Skeleton width="w-32" height="h-4" />
                        <Skeleton width="w-24" height="h-3" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton width={`w-${Math.floor(Math.random() * 20) + 16}`} height="h-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Card skeleton loader
export const CardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white overflow-hidden shadow-soft rounded-xl p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Skeleton width="w-8" height="h-8" rounded="rounded-lg" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <Skeleton width="w-20" height="h-4" className="mb-2" />
            <Skeleton width="w-16" height="h-6" />
          </div>
        </div>
        <div className="mt-4">
          <Skeleton width="w-12" height="h-3" />
        </div>
      </div>
    ))}
  </div>
);

// Chart skeleton loader
export const ChartSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-soft animate-fade-in">
    <div className="mb-4">
      <Skeleton width="w-48" height="h-6" className="mb-2" />
      <Skeleton width="w-32" height="h-4" />
    </div>
    <div className="h-72 bg-gray-50 rounded-lg flex items-end justify-center space-x-2 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-gradient-to-t from-primary-200 to-primary-100 rounded-t animate-pulse"
          style={{
            width: '20px',
            height: `${Math.random() * 60 + 20}%`,
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  </div>
);

// File list skeleton loader
export const FileListSkeleton = ({ count = 6 }) => (
  <div className="space-y-4 animate-fade-in">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white p-4 rounded-xl shadow-soft border border-gray-100">
        <div className="flex items-center space-x-4">
          <Skeleton width="w-12" height="h-12" rounded="rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-48" height="h-5" />
            <div className="flex space-x-4">
              <Skeleton width="w-16" height="h-4" />
              <Skeleton width="w-20" height="h-4" />
              <Skeleton width="w-24" height="h-4" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton width="w-16" height="h-8" rounded="rounded-md" />
            <Skeleton width="w-16" height="h-8" rounded="rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Dashboard skeleton loader
export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton width="w-48" height="h-8" />
      <Skeleton width="w-32" height="h-10" rounded="rounded-md" />
    </div>
    
    {/* Stats Cards */}
    <CardSkeleton count={4} />
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    
    {/* Recent Files */}
    <div className="bg-white shadow-soft rounded-xl p-6">
      <Skeleton width="w-32" height="h-6" className="mb-4" />
      <FileListSkeleton count={3} />
    </div>
  </div>
);

// Form skeleton loader
export const FormSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="space-y-4">
      <Skeleton width="w-24" height="h-5" />
      <Skeleton width="w-full" height="h-10" rounded="rounded-md" />
    </div>
    <div className="space-y-4">
      <Skeleton width="w-32" height="h-5" />
      <Skeleton width="w-full" height="h-32" rounded="rounded-md" />
    </div>
    <div className="flex space-x-3">
      <Skeleton width="w-24" height="h-10" rounded="rounded-md" />
      <Skeleton width="w-20" height="h-10" rounded="rounded-md" />
    </div>
  </div>
);

export default Skeleton;
