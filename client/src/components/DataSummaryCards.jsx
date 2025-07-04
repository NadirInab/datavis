import React from 'react';
import PropTypes from 'prop-types';
import { generateDataSummary, detectDataAnomalies } from '../utils/dataInsights';

const DataSummaryCards = ({ data }) => {
  const summary = generateDataSummary(data);
  const anomalies = detectDataAnomalies(data, summary?.columnInsights || {});

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 text-[#5A827E] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Data Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FAFFCA]/30 rounded-lg p-4 border border-[#B9D4AA]/20">
            <div className="text-sm text-[#5A827E]/70 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Total Rows
            </div>
            <div className="text-2xl font-semibold text-[#5A827E]">{summary.totalRows.toLocaleString()}</div>
          </div>
          <div className="bg-[#FAFFCA]/30 rounded-lg p-4 border border-[#B9D4AA]/20">
            <div className="text-sm text-[#5A827E]/70 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Total Columns
            </div>
            <div className="text-2xl font-semibold text-[#5A827E]">{summary.totalColumns}</div>
          </div>
          <div className="bg-[#FAFFCA]/30 rounded-lg p-4 border border-[#B9D4AA]/20">
            <div className="text-sm text-[#5A827E]/70 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Data Quality Score
            </div>
            <div className="text-2xl font-semibold text-[#5A827E]">{summary.dataQuality.score}%</div>
          </div>
        </div>
      </div>

      {/* Data Quality Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Data Quality Assessment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Overall Quality Score</div>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    parseFloat(summary.dataQuality.score) >= 80 ? 'bg-green-500' :
                    parseFloat(summary.dataQuality.score) >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${summary.dataQuality.score}%` }}
                ></div>
              </div>
              <span className="text-lg font-semibold text-gray-900">{summary.dataQuality.score}%</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {parseFloat(summary.dataQuality.score) >= 80 ? 'Excellent quality' :
               parseFloat(summary.dataQuality.score) >= 60 ? 'Good quality' :
               'Needs improvement'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Data Issues Found</div>
            <div className="text-lg font-semibold text-gray-900">
              {anomalies.length} {anomalies.length === 1 ? 'issue' : 'issues'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {anomalies.filter(a => a.severity === 'high').length} high, {' '}
              {anomalies.filter(a => a.severity === 'medium').length} medium, {' '}
              {anomalies.filter(a => a.severity === 'low').length} low priority
            </div>
          </div>
        </div>
      </div>

      {/* Column Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Column Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(summary.columnInsights).map(([column, insight]) => (
            <div key={column} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {column}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className={`font-medium px-2 py-1 rounded text-xs ${
                    insight.dataType === 'decimal' || insight.dataType === 'integer' ? 'bg-blue-100 text-blue-700' :
                    insight.dataType === 'date' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {insight.dataType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completeness:</span>
                  <span className={`font-medium ${
                    parseFloat(insight.completeness) >= 90 ? 'text-green-600' :
                    parseFloat(insight.completeness) >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {insight.completeness}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unique Values:</span>
                  <span className="font-medium text-gray-900">{insight.uniqueValues.toLocaleString()}</span>
                </div>
                {insight.topValues.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="text-gray-600 mb-2 text-xs font-medium">Most Common Values:</div>
                    <div className="space-y-1">
                      {insight.topValues.map((tv, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-700 truncate mr-2" title={String(tv.value)}>
                            {String(tv.value).substring(0, 15)}{String(tv.value).length > 15 ? '...' : ''}
                          </span>
                          <span className="text-gray-500 font-medium">({tv.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {insight.anomalies && insight.anomalies.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-orange-600 font-medium">
                      ⚠️ {insight.anomalies.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Charts */}
      {summary.suggestedCharts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Recommended Visualizations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.suggestedCharts.map((chart, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-purple-200 transition-colors">
                <div className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {chart.title}
                </div>
                <div className="text-sm text-gray-600 mb-3">{chart.reason}</div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    chart.suitability === 'high' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {chart.suitability.toUpperCase()} suitability
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    chart.type === 'bar' ? 'bg-blue-100 text-blue-700' :
                    chart.type === 'line' ? 'bg-green-100 text-green-700' :
                    chart.type === 'pie' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {chart.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Data Quality Issues
          </h3>
          <div className="space-y-3">
            {anomalies.map((anomaly, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                anomaly.severity === 'high' ? 'bg-red-50 border-red-400 text-red-700' :
                anomaly.severity === 'medium' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                'bg-blue-50 border-blue-400 text-blue-700'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium flex items-center">
                      {anomaly.severity === 'high' && (
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {anomaly.severity === 'medium' && (
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {anomaly.severity === 'low' && (
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                      {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}
                    </div>
                    <div className="text-sm mt-1">{anomaly.message}</div>
                    {anomaly.column && (
                      <div className="text-xs mt-1 opacity-75">Column: {anomaly.column}</div>
                    )}
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${
                    anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                    anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {anomaly.severity.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Issues Found */}
      {anomalies.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-6">
            <svg className="w-12 h-12 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Excellent Data Quality!</h3>
            <p className="text-gray-600">No significant data quality issues were detected in your dataset.</p>
          </div>
        </div>
      )}
    </div>
  );
};

DataSummaryCards.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default DataSummaryCards;