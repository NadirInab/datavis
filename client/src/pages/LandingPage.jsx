import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button, { Icons } from '../components/ui/Button';
import { FeatureCard } from '../components/ui/Card';
import { FeatureModal } from '../components/ui/Modal';
import { useAuth } from '../context/FirebaseAuthContext';
import SEOHead from '../components/SEO/SEOHead';

const LandingPage = () => {
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [modalFeature, setModalFeature] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Animation trigger on mount
  useEffect(() => {
    setIsVisible(true);

    // Scroll listener for parallax effects
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Feature data for modals
  const featureData = {
    upload: {
      title: "Instant Upload",
      icon: Icons.Upload,
      description: "Simply drag & drop your CSV files or use our intuitive file selector. No complex data formatting or preparation required.",
      details: [
        "Support for CSV, Excel, TSV, and JSON formats",
        "Automatic data type detection and validation",
        "Real-time preview of your data structure",
        "Smart column mapping and suggestions",
        "Bulk upload for multiple files"
      ],
      benefits: [
        "Save hours of data preparation time",
        "Reduce errors with automatic validation",
        "Get started in seconds, not hours",
        "Handle files up to 100MB in size"
      ],
      ctaText: "Try Upload Now",
      ctaAction: () => {
        const uploadSection = document.getElementById('upload-demo');
        if (uploadSection) {
          uploadSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
    analysis: {
      title: "AI-Powered Analysis",
      icon: Icons.Chart,
      description: "Our intelligent engine automatically detects data patterns and recommends the most effective visualization types for your specific dataset.",
      details: [
        "Machine learning-powered pattern recognition",
        "Automatic chart type recommendations",
        "Statistical analysis and insights generation",
        "Outlier detection and data quality assessment",
        "Trend analysis and forecasting capabilities"
      ],
      benefits: [
        "Discover hidden insights automatically",
        "Make data-driven decisions faster",
        "No statistical expertise required",
        "Professional-grade analysis tools"
      ],
      ctaText: "See Examples",
      ctaAction: () => window.open('/test/visualization', '_blank')
    },
    export: {
      title: "Export & Share",
      icon: Icons.Download,
      description: "Export your visualizations as high-quality PNG, PDF, or interactive formats. Share insights with your team instantly.",
      details: [
        "High-resolution PNG and SVG exports",
        "Professional PDF reports with branding",
        "Interactive HTML dashboards",
        "PowerPoint-ready slide exports",
        "Excel data exports with formatting"
      ],
      benefits: [
        "Professional presentation quality",
        "Multiple format options",
        "Instant sharing capabilities",
        "Brand customization options"
      ],
      ctaText: "View Export Options",
      ctaAction: () => {}
    },
    dashboards: {
      title: "Custom Dashboards",
      icon: Icons.Settings,
      description: "Create personalized dashboards with multiple charts, filters, and interactive controls tailored to your workflow.",
      details: [
        "Drag-and-drop dashboard builder",
        "Real-time data filtering and sorting",
        "Interactive charts and controls",
        "Custom color schemes and branding",
        "Responsive design for all devices"
      ],
      benefits: [
        "Tailored to your specific needs",
        "Real-time data updates",
        "Professional appearance",
        "Easy to use and maintain"
      ],
      ctaText: "Explore Dashboards",
      ctaAction: () => window.location.href = '/app'
    },
    collaboration: {
      title: "Real-time Collaboration",
      icon: Icons.Eye,
      description: "Work together with your team in real-time. Share dashboards, add comments, and make data-driven decisions collaboratively.",
      details: [
        "Real-time collaborative editing",
        "Comment and annotation system",
        "Role-based access control",
        "Team workspace management",
        "Activity tracking and notifications",
        "Shared dashboard libraries"
      ],
      benefits: [
        "Improved team productivity",
        "Better decision making",
        "Centralized data insights",
        "Secure team collaboration"
      ],
      ctaText: "Learn More",
      ctaAction: () => {}
    },
    security: {
      title: "Enterprise Security",
      icon: Icons.Check,
      description: "Bank-level security with encrypted data transmission, secure cloud storage, and compliance with industry standards.",
      details: [
        "256-bit SSL encryption",
        "GDPR compliance",
        "SOC 2 Type II certified",
        "Zero data retention policy",
        "Role-based access control",
        "Audit logs and monitoring",
        "Regular security assessments"
      ],
      benefits: [
        "Enterprise-grade protection",
        "Regulatory compliance",
        "Data privacy guaranteed",
        "Peace of mind for your business"
      ],
      ctaText: "Security Details",
      ctaAction: () => {
        const securitySection = document.querySelector('[data-section="security"]');
        if (securitySection) {
          securitySection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const openModal = (featureKey) => {
    setModalFeature(featureData[featureKey]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalFeature(null);
  };

  return (
    <>
      <SEOHead
        pageKey="home"
        customTitle="CSV Analytics Studio - Professional Data Visualization & Business Intelligence Dashboard"
        customDescription="Transform your CSV files into powerful business insights. Create interactive dashboards, analyze spreadsheet data, and visualize trends with our professional analytics platform. Free trial available."
        customKeywords="csv analytics dashboard, data visualization tool, business intelligence dashboard, spreadsheet analysis software, csv data processing, online csv analyzer"
      />

      <div className="bg-gradient-to-br from-highlight-50 via-white to-primary-50/20 min-h-screen relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-10 w-32 h-32 bg-primary-100/40 rounded-full blur-xl animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          ></div>
          <div
            className="absolute top-40 right-20 w-24 h-24 bg-secondary-100/40 rounded-full blur-lg animate-pulse delay-1000"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          ></div>
          <div
            className="absolute bottom-40 left-1/4 w-20 h-20 bg-accent-100/40 rounded-full blur-lg animate-pulse delay-2000"
            style={{ transform: `translateY(${scrollY * 0.08}px)` }}
          ></div>
        </div>

        {/* Hero section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-secondary-500/3 to-accent-500/5"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center">
              {/* Animated logo */}
              <div className={`mb-8 flex justify-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    <Icons.Chart className="w-12 h-12 text-white" />
                  </div>
                  {/* Floating data points */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent-400 rounded-full animate-bounce delay-500"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-secondary-400 rounded-full animate-bounce delay-1000"></div>
                  <div className="absolute top-1/2 -right-4 w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-1500"></div>
                </div>
              </div>
              {/* Main headline with staggered animation */}
              <h1 className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="block bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
                  Professional CSV Analytics
                </span>
                <span className="block text-primary-700 mt-2 text-4xl md:text-5xl">
                  & Data Visualization Dashboard
                </span>
              </h1>

              {/* Subtitle with delayed animation */}
              <p className={`mt-6 max-w-4xl mx-auto text-xl md:text-2xl text-primary-600/80 leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                Transform spreadsheet data into professional dashboards trusted by <span className="font-semibold text-secondary-600">10,000+</span> businesses worldwide.
                Create stunning visualizations and generate actionable insights in minutes—no coding required.
              </p>

              {/* Trust indicators with staggered animation */}
              <div className={`mt-8 flex flex-wrap justify-center gap-4 text-sm text-primary-600/70 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full border border-secondary-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Icons.Shield className="w-4 h-4 text-accent-600" />
                  <span className="font-medium">Enterprise Security</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full border border-secondary-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Icons.BarChart className="w-4 h-4 text-primary-600" />
                  <span className="font-medium">50+ Chart Types</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full border border-secondary-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Icons.Users className="w-4 h-4 text-secondary-600" />
                  <span className="font-medium">Team Collaboration</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full border border-secondary-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Icons.Download className="w-4 h-4 text-primary-600" />
                  <span className="font-medium">Professional Reports</span>
                </div>
              </div>

              {/* Call-to-action buttons with animation */}
              <div className={`mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {currentUser ? (
                  <Button
                    as={Link}
                    to="/app"
                    variant="primary"
                    size="lg"
                    icon={Icons.ArrowRight}
                    iconPosition="right"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Access Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      as={Link}
                      to="/register"
                      variant="primary"
                      size="lg"
                      icon={Icons.ArrowRight}
                      iconPosition="right"
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Start Free Trial
                    </Button>
                    <Button
                      as={Link}
                      to="/login"
                      variant="outline"
                      size="lg"
                      icon={Icons.Eye}
                      className="border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 transition-all duration-300"
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </div>

            {/* Demo preview */}
            <div className="mt-16 relative">
              <div id="upload-demo" className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-strong p-8 border border-primary-200 max-w-5xl mx-auto">
                {/* Data Visualization Preview */}
                <div className="aspect-video bg-gradient-to-br from-highlight-50 to-primary-50 rounded-2xl p-6 relative overflow-hidden">
                  {/* Preview Title */}
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-primary-800 mb-2">Transform Your Data Into Insights</h3>
                    <p className="text-sm text-primary-600 mb-4">See what's possible with your CSV data</p>
                    <div className="flex justify-center space-x-4 text-xs text-primary-500">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-primary-400 rounded-full mr-1"></div>
                        Interactive
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-secondary-400 rounded-full mr-1"></div>
                        Real-time
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-accent-400 rounded-full mr-1"></div>
                        Professional
                      </span>
                    </div>
                  </div>

                  {/* Sample Visualizations Grid */}
                  <div className="grid grid-cols-4 gap-4 h-full">
                    {/* Bar Chart */}
                    <div className="bg-white/70 rounded-xl p-4 border border-primary-100 hover:bg-white/80 transition-all duration-300">
                      <div className="text-center mb-2">
                        <h4 className="text-xs font-medium text-primary-700">Bar Charts</h4>
                      </div>
                      <div className="flex items-end justify-center space-x-1 h-12">
                        <div className="bg-primary-400 w-2 h-6 rounded-sm animate-pulse delay-100"></div>
                        <div className="bg-secondary-400 w-2 h-9 rounded-sm animate-pulse delay-200"></div>
                        <div className="bg-accent-400 w-2 h-12 rounded-sm animate-pulse delay-300"></div>
                        <div className="bg-primary-500 w-2 h-7 rounded-sm animate-pulse delay-400"></div>
                        <div className="bg-secondary-500 w-2 h-10 rounded-sm animate-pulse delay-500"></div>
                      </div>
                      <p className="text-xs text-primary-600 text-center mt-2">Compare categories</p>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white/70 rounded-xl p-4 border border-primary-100 hover:bg-white/80 transition-all duration-300">
                      <div className="text-center mb-2">
                        <h4 className="text-xs font-medium text-primary-700">Line Charts</h4>
                      </div>
                      <div className="relative h-12 flex items-center">
                        <svg className="w-full h-full" viewBox="0 0 80 40">
                          <path
                            d="M 5,30 Q 20,15 35,20 T 75,10"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-secondary-500"
                          />
                          <circle cx="75" cy="10" r="1.5" className="fill-accent-500 animate-pulse" />
                        </svg>
                      </div>
                      <p className="text-xs text-primary-600 text-center mt-2">Track trends</p>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-white/70 rounded-xl p-4 border border-primary-100 hover:bg-white/80 transition-all duration-300">
                      <div className="text-center mb-2">
                        <h4 className="text-xs font-medium text-primary-700">Pie Charts</h4>
                      </div>
                      <div className="flex justify-center h-12 items-center">
                        <svg className="w-10 h-10" viewBox="0 0 42 42">
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray="60 40" strokeDashoffset="25" className="text-primary-400" />
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="85" className="text-secondary-400" />
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="60" className="text-accent-400" />
                        </svg>
                      </div>
                      <p className="text-xs text-primary-600 text-center mt-2">Show proportions</p>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white/70 rounded-xl p-4 border border-primary-100 hover:bg-white/80 transition-all duration-300">
                      <div className="text-center mb-2">
                        <h4 className="text-xs font-medium text-primary-700">Data Tables</h4>
                      </div>
                      <div className="space-y-1 h-12 flex flex-col justify-center">
                        <div className="flex justify-between text-xs">
                          <span className="text-primary-600">Item A</span>
                          <span className="text-primary-800 font-medium">142</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-primary-600">Item B</span>
                          <span className="text-secondary-700 font-medium">89</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-primary-600">Item C</span>
                          <span className="text-accent-700 font-medium">67</span>
                        </div>
                      </div>
                      <p className="text-xs text-primary-600 text-center mt-2">Organize data</p>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={() => {
                        const uploadSection = document.querySelector('.feature-section');
                        if (uploadSection) {
                          uploadSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Icons.ArrowRight className="w-3 h-3 inline mr-1" />
                      Start Creating
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Trust Section */}
      <div className="py-16 bg-primary-50/30 border-y border-primary-200" data-section="security">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-lg font-semibold text-primary-700 mb-4">
              Trusted by Enterprise Customers Worldwide
            </h3>
            <p className="text-primary-600 max-w-2xl mx-auto">
              Your data security is our top priority. We maintain the highest standards of compliance and protection.
            </p>
          </div>

          {/* Security Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {/* SSL Certificate */}
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mb-3">
                <Icons.Shield className="w-6 h-6 text-accent-600" />
              </div>
              <h4 className="font-semibold text-primary-800 text-sm mb-1">SSL Encrypted</h4>
              <p className="text-xs text-primary-600 text-center">256-bit encryption</p>
            </div>

            {/* GDPR Compliance */}
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <Icons.FileText className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="font-semibold text-primary-800 text-sm mb-1">GDPR Compliant</h4>
              <p className="text-xs text-primary-600 text-center">Data protection</p>
            </div>

            {/* SOC 2 Type II */}
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-3">
                <Icons.Award className="w-6 h-6 text-secondary-600" />
              </div>
              <h4 className="font-semibold text-primary-800 text-sm mb-1">SOC 2 Type II</h4>
              <p className="text-xs text-primary-600 text-center">Audited security</p>
            </div>

            {/* 99.9% Uptime */}
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-primary-200 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mb-3">
                <Icons.CheckCircle className="w-6 h-6 text-accent-600" />
              </div>
              <h4 className="font-semibold text-primary-800 text-sm mb-1">99.9% Uptime</h4>
              <p className="text-xs text-primary-600 text-center">Reliable service</p>
            </div>
          </div>

          {/* Additional Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-primary-600">
            <div className="flex items-center space-x-2">
              <Icons.Lock className="w-4 h-4 text-primary-500" />
              <span>Zero data retention policy</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icons.Globe className="w-4 h-4 text-primary-500" />
              <span>Global CDN infrastructure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icons.Users className="w-4 h-4 text-primary-500" />
              <span>10,000+ satisfied customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="py-24 bg-white relative overflow-hidden feature-section">
        <div className="absolute inset-0 bg-gradient-to-b from-highlight-50/30 to-transparent"></div>
        {/* Floating background elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-primary-100/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-secondary-100/20 rounded-full blur-lg"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-4 animate-fade-in">
              Powerful Features
            </h2>
            <p className="text-4xl md:text-5xl font-bold tracking-tight text-primary-900 mb-6 animate-fade-in delay-200">
              Transform your data into
              <span className="block bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
                actionable insights
              </span>
            </p>
            <p className="max-w-4xl mx-auto text-xl text-primary-600 leading-relaxed animate-fade-in delay-400">
              Our AI-powered platform automatically analyzes your CSV data and suggests the most effective
              visualizations for your specific dataset, saving you hours of manual work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            <FeatureCard
              icon={Icons.Upload}
              title="Instant Upload"
              description="Simply drag & drop your CSV files or use our intuitive file selector. No complex data formatting or preparation required."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                  className="text-primary-600 hover:text-primary-700"
                  onClick={() => openModal('upload')}
                >
                  Learn More
                </Button>
              }
            />

            <FeatureCard
              icon={Icons.Chart}
              title="AI-Powered Analysis"
              description="Our intelligent engine automatically detects data patterns and recommends the most effective visualization types for your specific dataset."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                  className="text-secondary-600 hover:text-secondary-700"
                  onClick={() => openModal('analysis')}
                >
                  See Examples
                </Button>
              }
            />

            <FeatureCard
              icon={Icons.Download}
              title="Export & Share"
              description="Export your visualizations as high-quality PNG, PDF, or interactive formats. Share insights with your team instantly."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                  className="text-accent-600 hover:text-accent-700"
                  onClick={() => openModal('export')}
                >
                  View Formats
                </Button>
              }
            />

            <FeatureCard
              icon={Icons.Settings}
              title="Custom Dashboards"
              description="Create personalized dashboards with multiple charts, filters, and interactive controls tailored to your workflow."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                  className="text-primary-600 hover:text-primary-700"
                  onClick={() => openModal('dashboards')}
                >
                  Explore
                </Button>
              }
            />

            <FeatureCard
              icon={Icons.Eye}
              title="Real-time Collaboration"
              description="Work together with your team in real-time. Share dashboards, add comments, and make data-driven decisions collaboratively."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                  className="text-secondary-600 hover:text-secondary-700"
                  onClick={() => openModal('collaboration')}
                >
                  Team Features
                </Button>
              }
            />

            <FeatureCard
              icon={Icons.Check}
              title="Enterprise Security"
              description="Bank-level security with encrypted data transmission, secure cloud storage, and compliance with industry standards."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                  className="text-accent-600 hover:text-accent-700"
                  onClick={() => openModal('security')}
                >
                  Security Details
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Pricing section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Pricing</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Plans for teams of all sizes
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Start with our forever-free plan. Upgrade anytime as your needs grow.
            </p>
          </div>

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
            {/* Free Tier */}
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Free</h2>
                <p className="mt-4 text-sm text-gray-500">Perfect for individuals just getting started with data visualization.</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$0</span>
                  <span className="text-base font-medium text-gray-500">/mo</span>
                </p>
                <Link
                  to="/register"
                  className="mt-8 block w-full bg-indigo-50 border border-indigo-200 rounded-md py-2 text-sm font-semibold text-indigo-700 text-center hover:bg-indigo-100"
                >
                  Start for free
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Up to 3 CSV files</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Basic visualizations</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">7-day data storage</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Export as PNG</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Pro</h2>
                <p className="mt-4 text-sm text-gray-500">For professionals who need more power and storage.</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$15</span>
                  <span className="text-base font-medium text-gray-500">/mo</span>
                </p>
                <Link
                  to="/register"
                  className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700"
                >
                  Start free trial
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Up to 50 CSV files</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Advanced visualizations</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">30-day data storage</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Export in multiple formats</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Team sharing</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Enterprise Tier */}
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Enterprise</h2>
                <p className="mt-4 text-sm text-gray-500">For organizations with advanced needs and large teams.</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$49</span>
                  <span className="text-base font-medium text-gray-500">/mo</span>
                </p>
                <Link
                  to="/contact"
                  className="mt-8 block w-full bg-indigo-50 border border-indigo-200 rounded-md py-2 text-sm font-semibold text-indigo-700 text-center hover:bg-indigo-100"
                >
                  Contact sales
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Unlimited CSV files</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">All features</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">365-day data storage</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Priority support</span>
                  </li>
                  <li className="flex space-x-3">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Custom visualizations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center">
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                About
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Blog
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Jobs
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Press
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Privacy
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Terms
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Contact
              </a>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; 2025 DataVizPro, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>

    {/* Feature Modal */}
    <FeatureModal
      isOpen={isModalOpen}
      onClose={closeModal}
      feature={modalFeature}
    />
    </>
  );
};

export default LandingPage;