import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button, { Icons } from '../components/ui/Button';
import { FeatureCard } from '../components/ui/Card';
import { FeatureModal } from '../components/ui/Modal';
import { useAuth } from '../context/FirebaseAuthContext';
import SEOHead from '../components/SEO/SEOHead';
import AnimatedHero from '../components/landing/AnimatedHero';
import ModernPricing from '../components/landing/ModernPricing';
import TestimonialsSection from '../components/landing/TestimonialsSection';

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
    <React.Fragment>
      <SEOHead
        pageKey="home"
        customTitle="CSV Analytics Studio - Professional Data Visualization & Business Intelligence Dashboard"
        customDescription="Transform your CSV files into powerful business insights. Create interactive dashboards, analyze spreadsheet data, and visualize trends with our professional analytics platform. Free trial available."
        customKeywords="csv analytics dashboard, data visualization tool, business intelligence dashboard, spreadsheet analysis software, csv data processing, online csv analyzer"
      />

      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, #FAFFCA, #dbeeed, #c5e1cf)'
        }}
      >
        {/* Enhanced floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-pulse"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              background: 'linear-gradient(to bottom right, rgba(143, 196, 193, 0.8), rgba(156, 202, 171, 0.6))'
            }}
          ></div>
          <div
            className="absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-pulse"
            style={{
              transform: `translateY(${scrollY * 0.15}px)`,
              background: 'linear-gradient(to bottom right, rgba(156, 202, 171, 0.8), rgba(199, 219, 162, 0.6))',
              animationDelay: '1s'
            }}
          ></div>
          <div
            className="absolute bottom-40 left-1/4 w-20 h-20 rounded-full blur-lg animate-pulse"
            style={{
              transform: `translateY(${scrollY * 0.08}px)`,
              background: 'linear-gradient(to bottom right, rgba(199, 219, 162, 0.8), rgba(250, 255, 202, 0.6))',
              animationDelay: '2s'
            }}
          ></div>
          <div
            className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full blur-md animate-pulse"
            style={{
              transform: `translateY(${scrollY * 0.12}px)`,
              background: 'linear-gradient(to bottom right, rgba(250, 255, 202, 0.7), rgba(107, 165, 162, 0.5))',
              animationDelay: '3s'
            }}
          ></div>
        </div>

        {/* Modern Animated Hero Section */}
        <AnimatedHero />

        {/* Demo Preview Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Demo preview */}
          <div className="mt-16 relative">
            <div
              id="upload-demo"
              className="backdrop-blur-sm rounded-3xl shadow-strong p-8 border max-w-5xl mx-auto ring-1"
              style={{
                background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.95), rgba(185, 221, 219, 0.6))',
                borderColor: 'rgba(107, 165, 162, 0.5)',
                ringColor: 'rgba(156, 202, 171, 0.4)'
              }}
            >
                {/* Data Visualization Preview */}
                <div
                  className="aspect-video rounded-2xl p-6 relative overflow-hidden border"
                  style={{
                    background: 'linear-gradient(to bottom right, #FAFFCA, rgba(222, 235, 199, 0.8), rgba(197, 225, 207, 0.6))',
                    borderColor: 'rgba(143, 196, 193, 0.6)'
                  }}
                >
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
                    <div className="bg-gradient-to-br from-white/90 to-primary-50/60 rounded-xl p-4 border border-primary-200/60 hover:from-white/95 hover:to-primary-100/40 transition-all duration-300 shadow-sm">
                      <div className="text-center mb-2">
                        <h4 className="text-xs font-medium text-primary-800">Bar Charts</h4>
                      </div>
                      <div className="flex items-end justify-center space-x-1 h-12">
                        <div className="bg-gradient-to-t from-primary-500 to-primary-400 w-2 h-6 rounded-sm animate-pulse delay-100"></div>
                        <div className="bg-gradient-to-t from-secondary-500 to-secondary-400 w-2 h-9 rounded-sm animate-pulse delay-200"></div>
                        <div className="bg-gradient-to-t from-accent-500 to-accent-400 w-2 h-12 rounded-sm animate-pulse delay-300"></div>
                        <div className="bg-gradient-to-t from-primary-600 to-primary-500 w-2 h-7 rounded-sm animate-pulse delay-400"></div>
                        <div className="bg-gradient-to-t from-secondary-600 to-secondary-500 w-2 h-10 rounded-sm animate-pulse delay-500"></div>
                      </div>
                      <p className="text-xs text-primary-700 text-center mt-2">Compare categories</p>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-gradient-to-br from-white/90 to-secondary-50/60 rounded-xl p-4 border border-secondary-200/60 hover:from-white/95 hover:to-secondary-100/40 transition-all duration-300 shadow-sm">
                      <div className="text-center mb-2">
                        <h4 className="text-xs font-medium text-secondary-800">Line Charts</h4>
                      </div>
                      <div className="relative h-12 flex items-center">
                        <svg className="w-full h-full" viewBox="0 0 80 40">
                          <path
                            d="M 5,30 Q 20,15 35,20 T 75,10"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-secondary-600"
                          />
                          <circle cx="75" cy="10" r="1.5" className="fill-accent-500 animate-pulse" />
                        </svg>
                      </div>
                      <p className="text-xs text-secondary-700 text-center mt-2">Track trends</p>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-gradient-to-br from-white/90 to-accent-50/60 rounded-xl p-4 border border-accent-200/60 hover:from-white/95 hover:to-accent-100/40 transition-all duration-300 shadow-sm">
                      <div className="text-center mb-2">
                        <h4 className="text-xs font-medium text-accent-800">Pie Charts</h4>
                      </div>
                      <div className="flex justify-center h-12 items-center">
                        <svg className="w-10 h-10" viewBox="0 0 42 42">
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray="60 40" strokeDashoffset="25" className="text-primary-500" />
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="85" className="text-secondary-500" />
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="60" className="text-accent-500" />
                        </svg>
                      </div>
                      <p className="text-xs text-accent-700 text-center mt-2">Show proportions</p>
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

                      

      <TestimonialsSection />

      
      <ModernPricing />

   
      <div
        className="py-16 border-y"
        style={{
          background: 'linear-gradient(to bottom right, rgba(185, 221, 219, 0.6), rgba(197, 225, 207, 0.5), rgba(222, 235, 199, 0.4))',
          borderColor: 'rgba(107, 165, 162, 0.5)'
        }}
        data-section="security"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-lg font-semibold text-primary-800 mb-4">
              Trusted by Enterprise Customers Worldwide
            </h3>
            <p className="text-primary-700 max-w-2xl mx-auto">
              Your data security is our top priority. We maintain the highest standards of compliance and protection.
            </p>
          </div>

          {/* Security Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {/* SSL Certificate */}
            <div className="flex flex-col items-center p-6 bg-gradient-to-br from-white/95 to-accent-50/60 rounded-xl shadow-sm border border-accent-200/60 hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:to-accent-100/40 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-200 to-accent-100 rounded-full flex items-center justify-center mb-3">
                <Icons.Shield className="w-6 h-6 text-accent-700" />
              </div>
              <h4 className="font-semibold text-accent-800 text-sm mb-1">SSL Encrypted</h4>
              <p className="text-xs text-accent-600 text-center">256-bit encryption</p>
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

      <div className="py-24 bg-gradient-to-br from-white via-highlight-50/20 to-secondary-50/30 relative overflow-hidden feature-section">
        <div className="absolute inset-0 bg-gradient-to-b from-highlight-100/40 via-transparent to-primary-50/20"></div>
        {/* Enhanced floating background elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-secondary-200/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-br from-secondary-200/30 to-accent-200/20 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-accent-200/20 to-highlight-200/30 rounded-full blur-md"></div>

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



      <footer className="bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/20 border-t border-primary-200/50">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center">
            <div className="px-5 py-2">
              <a href="#" className="text-base text-primary-600 hover:text-primary-800 transition-colors duration-200">
                About
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-primary-600 hover:text-primary-800 transition-colors duration-200">
                Blog
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-primary-600 hover:text-primary-800 transition-colors duration-200">
                Jobs
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-primary-600 hover:text-primary-800 transition-colors duration-200">
                Press
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-primary-600 hover:text-primary-800 transition-colors duration-200">
                Privacy
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Terms
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-primary-600 hover:text-primary-800 transition-colors duration-200">
                Contact
              </a>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-primary-500">
            &copy; 2025 DataVizPro, Inc. All rights reserved.
          </p>
        </div>
      </footer>

    <FeatureModal
      isOpen={isModalOpen}
      onClose={closeModal}
      feature={modalFeature}
    />

    </React.Fragment>
  );
};

export default LandingPage;