import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import StatsCard from '../components/StatsCard';
import Button from '../components/ui/Button';
import { ChartCard, FileCard } from '../components/ui/Card';
import { CardSkeleton, FileListSkeleton } from '../components/loading/SkeletonLoader';
import VisitorBanner from '../components/visitor/VisitorBanner';
import { getGuestMetrics, getUserMetrics } from '../utils/rateLimiting';
import { userAPI } from '../services/api';

// Define Icons if not imported from Button
const Icons = {
  Upload: (props) => (
    <svg {...props} className={`w-5 h-5 ${props.className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
    </svg>
  ),
  Eye: (props) => (
    <svg {...props} className={`w-5 h-5 ${props.className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
    </svg>
  ),
  ArrowRight: (props) => (
    <svg {...props} className={`w-5 h-5 ${props.className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
    </svg>
  )
};

const Dashboard = () => {
  const { currentUser, isAdmin, isRegularUser, isVisitor } = useAuth() || {};
  const navigate = useNavigate();
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalVisualizations: 0,
    lastUpload: null,
    favoriteChartType: 'None',
  });

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        if (!currentUser && !isVisitor()) {
          setStats({
            totalFiles: 0,
            totalVisualizations: 0,
            lastUpload: null,
            favoriteChartType: 'None',
          });
          setRecentFiles([]);
          return;
        }

        if (currentUser) {
          // Authenticated user - fetch dashboard data from API
          try {
            const dashboardResponse = await userAPI.getDashboard();
            if (dashboardResponse.success && dashboardResponse.data) {
              const { stats, recentFiles } = dashboardResponse.data;
              setStats({
                totalFiles: stats.totalFiles || 0,
                totalVisualizations: stats.visualizationsCreated || 0,
                lastUpload: recentFiles && recentFiles.length > 0 ? recentFiles[0].uploadedAt : null,
                favoriteChartType: 'Chart', // TODO: Calculate from data
              });
              setRecentFiles(recentFiles || []);
            } else {
              // Fallback to default values
              setStats({
                totalFiles: 0,
                totalVisualizations: 0,
                lastUpload: null,
                favoriteChartType: 'None',
              });
              setRecentFiles([]);
            }
          } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Fallback to localStorage-based metrics for authenticated users
            const metrics = getUserMetrics(currentUser);
            setStats({
              totalFiles: Number(metrics?.filesUploaded) || 0,
              totalVisualizations: Array.isArray(metrics?.uploadHistory)
                ? metrics.uploadHistory.reduce((acc, file) => acc + (Array.isArray(file?.visualizations) ? file.visualizations.length : 0), 0)
                : 0,
              lastUpload: Array.isArray(metrics?.uploadHistory) && metrics.uploadHistory.length > 0
                ? metrics.uploadHistory[0]?.uploadedAt || metrics.uploadHistory[0]?.timestamp
                : null,
              favoriteChartType: 'None',
            });
            setRecentFiles(
              Array.isArray(metrics?.uploadHistory)
                ? [...metrics.uploadHistory]
                    .filter(f => f && (f.id || f._id))
                    .sort((a, b) => (b.uploadedAt || b.timestamp || 0) - (a.uploadedAt || a.timestamp || 0))
                    .slice(0, 5)
                : []
            );
          }
        } else if (isVisitor()) {
          // Visitor - use localStorage-based metrics
          const metrics = getGuestMetrics();
          setStats({
            totalFiles: Number(metrics?.filesUploaded) || 0,
            totalVisualizations: Array.isArray(metrics?.uploadHistory)
              ? metrics.uploadHistory.reduce((acc, file) => acc + (Array.isArray(file?.visualizations) ? file.visualizations.length : 0), 0)
              : 0,
            lastUpload: metrics?.lastUpload ? new Date(metrics.lastUpload) : null,
            favoriteChartType: (() => {
              const chartCounts = {};
              if (Array.isArray(metrics?.uploadHistory)) {
                metrics.uploadHistory.forEach(file => {
                  (Array.isArray(file?.visualizations) ? file.visualizations : []).forEach(viz => {
                    if (viz?.type) {
                      chartCounts[viz.type] = (chartCounts[viz.type] || 0) + 1;
                    }
                  });
                });
              }
              return Object.keys(chartCounts).length > 0
                ? Object.keys(chartCounts).reduce((a, b) => chartCounts[a] > chartCounts[b] ? a : b)
                : 'None';
            })(),
          });
          setRecentFiles(
            Array.isArray(metrics?.uploadHistory)
              ? [...metrics.uploadHistory]
                  .filter(f => f && (f.id || f._id))
                  .sort((a, b) => (b.uploadedAt || b.timestamp || 0) - (a.uploadedAt || a.timestamp || 0))
                  .slice(0, 5)
              : []
          );
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setStats({
          totalFiles: 0,
          totalVisualizations: 0,
          lastUpload: null,
          favoriteChartType: 'None',
        });
        setRecentFiles([]);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
    // Listen for guest-files-updated event
    const handleGuestFilesUpdated = () => loadUserData();
    window.addEventListener('guest-files-updated', handleGuestFilesUpdated);
    return () => {
      window.removeEventListener('guest-files-updated', handleGuestFilesUpdated);
    };
  }, [currentUser, isVisitor]);

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="space-y-2">
            <div className="h-6 sm:h-8 w-48 sm:w-64 bg-[#B9D4AA]/30 rounded animate-pulse"></div>
            <div className="h-3 sm:h-4 w-32 sm:w-48 bg-[#B9D4AA]/20 rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-2 sm:space-x-3">
            <div className="h-8 sm:h-10 w-24 sm:w-32 bg-[#B9D4AA]/30 rounded animate-pulse"></div>
            <div className="h-8 sm:h-10 w-24 sm:w-32 bg-[#5A827E]/20 rounded animate-pulse"></div>
          </div>
        </div>
        <CardSkeleton count={4} />
        <div className="space-y-6">
          <div className="h-64 sm:h-80 bg-[#B9D4AA]/20 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-0">
      {/* Visitor Banner */}
      <VisitorBanner />

      {/* Welcome Section - Optimized for Full Width */}
      <div className="bg-gradient-to-r from-[#5A827E]/5 to-[#84AE92]/5 rounded-2xl p-4 sm:p-8 mb-2 sm:mb-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#5A827E] mb-3">
              Welcome back, {typeof currentUser?.name === 'string' && currentUser.name.split(' ')[0] ? currentUser.name.split(' ')[0] : 'User'}!
            </h1>
            <p className="text-base sm:text-lg text-[#5A827E]/70 max-w-2xl">
              Here's what's happening with your data today. Manage your CSV files, create visualizations, and gain insights from your data.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:flex-shrink-0">
            <Button
              as={Link}
              to="/app/files"
              variant="outline"
              icon={Icons.Eye}
              className="w-full sm:w-auto"
              size="lg"
            >
              <span className="hidden sm:inline">View All Files</span>
              <span className="sm:hidden">All Files</span>
            </Button>
            <Button
              as={Link}
              to="/app/upload"
              variant="primary"
              icon={Icons.Upload}
              className="w-full sm:w-auto"
              size="lg"
            >
              <span className="hidden sm:inline">Upload CSV</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Optimized for Full Width */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 mt-2">
        <StatsCard
          title="Total Files"
          value={stats.totalFiles.toString()}
          color="primary"
          icon={{
            path: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          }}
          change={stats.totalFiles > 0 ? "+2 this week" : null}
          trend="up"
        />
        <StatsCard
          title="Visualizations"
          value={stats.totalVisualizations.toString()}
          color="secondary"
          icon={{
            path: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          }}
          change={stats.totalVisualizations > 0 ? "+5 this week" : null}
          trend="up"
        />
        <StatsCard
          title="Last Upload"
          value={stats.lastUpload ? new Date(stats.lastUpload).toLocaleDateString() : 'Never'}
          color="accent"
          icon={{
            path: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          }}
        />
        <StatsCard
          title="Favorite Chart"
          value={stats.favoriteChartType}
          color="success"
          icon={{
            path: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          }}
        />
      </div>

      {/* Recent Files - Full Width Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8 mt-2">
        {/* Recent Files Section */}
        <div className="xl:col-span-2">
          <ChartCard
            title="Recent Files"
            description="Your latest uploaded CSV files"
            actions={
              <Button
                as={Link}
                to="/app/files"
                variant="ghost"
                size="sm"
                icon={Icons.ArrowRight}
                iconPosition="right"
              >
                View All
              </Button>
            }
          >
            {Array.isArray(recentFiles) && recentFiles.length > 0 ? (
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <FileCard
                    key={file?.id || file?._id || Math.random()}
                    file={file}
                    onView={() => file?.id && navigate(`/app/visualize/${file.id}`)}
                    className="hover:shadow-md transition-shadow duration-200"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-[#B9D4AA]/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4">
                  <Icons.Upload className="w-6 h-6 sm:w-8 sm:h-8 text-[#5A827E]/60" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-[#5A827E] mb-2">No files yet</h3>
                <p className="text-sm sm:text-base text-[#5A827E]/70 mb-4 sm:mb-6 px-4">
                  Get started by uploading your first CSV file to create beautiful visualizations.
                </p>
                <Button
                  as={Link}
                  to="/app/upload"
                  variant="primary"
                  icon={Icons.Upload}
                  className="w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Upload Your First File</span>
                  <span className="sm:hidden">Upload File</span>
                </Button>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="xl:col-span-1 space-y-6 w-full xl:w-auto">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#84AE92]/20 shadow-sm w-full">
            <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Quick Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#5A827E]/70">Total Files</span>
                <span className="font-semibold text-[#5A827E]">{stats.totalFiles}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#5A827E]/70">Visualizations</span>
                <span className="font-semibold text-[#5A827E]">{stats.totalVisualizations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#5A827E]/70">Favorite Chart</span>
                <span className="font-semibold text-[#5A827E] capitalize">{stats.favoriteChartType}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#84AE92]/20 shadow-sm w-full">
            <h3 className="text-lg font-semibold text-[#5A827E] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                as={Link}
                to="/app/upload"
                variant="primary"
                icon={Icons.Upload}
                className="w-full justify-start"
                size="sm"
              >
                Upload New File
              </Button>
              {(isRegularUser() || isAdmin()) && (
                <Button
                  as={Link}
                  to="/app/files"
                  variant="outline"
                  icon={Icons.Eye}
                  className="w-full justify-start"
                  size="sm"
                >
                  Browse Files
                </Button>
              )}
              {(isRegularUser() || isAdmin()) && (
                <Button
                  as={Link}
                  to="/app/profile"
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </Button>
              )}
            </div>
          </div>

          {/* User Info Card */}
          {typeof isVisitor === 'function' && !isVisitor() && (
            <div className="bg-gradient-to-br from-[#5A827E]/5 to-[#84AE92]/5 rounded-2xl p-4 sm:p-6 border border-[#84AE92]/20 w-full">
              <h3 className="text-lg font-semibold text-[#5A827E] mb-3">Account Info</h3>
              <div className="space-y-2">
                <p className="text-sm text-[#5A827E]/70">
                  <span className="font-medium">Plan:</span> {currentUser?.subscription || 'Free'}
                </p>
                <p className="text-sm text-[#5A827E]/70">
                  <span className="font-medium">Role:</span> {currentUser?.role || 'User'}
                </p>
                {stats.lastUpload && (
                  <p className="text-sm text-[#5A827E]/70">
                    <span className="font-medium">Last Upload:</span> {new Date(stats.lastUpload).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
