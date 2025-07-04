import React from 'react';
import { Link } from 'react-router-dom';
import Button, { Icons } from '../components/ui/Button';
import { FeatureCard } from '../components/ui/Card';
import { useAuth } from '../context/FirebaseAuthContext';
import SEOHead from '../components/SEO/SEOHead';

const LandingPage = () => {
  const { currentUser } = useAuth();

  return (
    <>
      <SEOHead
        pageKey="home"
        customTitle="CSV Analytics Studio - Professional Data Visualization & Business Intelligence Dashboard"
        customDescription="Transform your CSV files into powerful business insights. Create interactive dashboards, analyze spreadsheet data, and visualize trends with our professional analytics platform. Free trial available."
        customKeywords="csv analytics dashboard, data visualization tool, business intelligence dashboard, spreadsheet analysis software, csv data processing, online csv analyzer"
      />

      <div className="bg-gradient-to-br from-[#FAFFCA] via-white to-[#B9D4AA]/20 min-h-screen">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/5 to-accent-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center animate-fade-in">
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center shadow-strong animate-float">
                <Icons.Chart className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="block bg-gradient-to-r from-[#5A827E] via-[#84AE92] to-[#B9D4AA] bg-clip-text text-transparent">
                Professional CSV Analytics
              </span>
              <span className="block text-[#5A827E] mt-2">
                & Data Visualization Dashboard
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-[#5A827E]/80 leading-relaxed">
              Transform your spreadsheet data into powerful business intelligence dashboards.
              Our professional CSV analytics platform helps you analyze data, create stunning visualizations,
              and generate actionable insights for better business decisions.
            </p>

            {/* Feature highlights */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-[#5A827E]/70">
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-[#84AE92]/20">
                <Icons.Upload className="w-4 h-4 text-[#5A827E]" />
                <span>CSV File Processing</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-[#84AE92]/20">
                <Icons.BarChart className="w-4 h-4 text-[#84AE92]" />
                <span>Business Intelligence</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-[#84AE92]/20">
                <Icons.TrendingUp className="w-4 h-4 text-[#B9D4AA]" />
                <span>Analytics Dashboard</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-[#84AE92]/20">
                <Icons.Download className="w-4 h-4 text-[#5A827E]" />
                <span>Professional Reports</span>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              {currentUser ? (
                <Button
                  as={Link}
                  to="/app"
                  variant="primary"
                  size="lg"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                  className="animate-bounce-gentle"
                >
                  Go to Dashboard
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
                    className="animate-bounce-gentle"
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    as={Link}
                    to="/login"
                    variant="outline"
                    size="lg"
                    icon={Icons.Eye}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {/* Demo preview */}
            <div className="mt-16 relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-strong p-8 border border-gray-200 max-w-4xl mx-auto">
                <div className="aspect-video bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Icons.Chart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Interactive Dashboard Preview</p>
                    <p className="text-sm text-gray-500 mt-2">Upload your CSV to see your data come to life</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="py-24 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-b from-highlight-50/30 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-4">
              Powerful Features
            </h2>
            <p className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Transform your data into
              <span className="block bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
                actionable insights
              </span>
            </p>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
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
  );
};

export default LandingPage;