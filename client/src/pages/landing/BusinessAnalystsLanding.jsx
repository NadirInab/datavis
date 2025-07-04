import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import Button, { Icons } from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const BusinessAnalystsLanding = () => {
  const features = [
    {
      icon: Icons.BarChart,
      title: 'Advanced Data Visualization',
      description: 'Create professional charts and dashboards from your CSV data with our intuitive business intelligence tools.'
    },
    {
      icon: Icons.TrendingUp,
      title: 'Trend Analysis & Forecasting',
      description: 'Identify patterns and trends in your business data to make informed strategic decisions.'
    },
    {
      icon: Icons.Database,
      title: 'Large Dataset Processing',
      description: 'Handle massive CSV files and complex datasets with enterprise-grade performance.'
    },
    {
      icon: Icons.Download,
      title: 'Professional Reporting',
      description: 'Generate executive-ready reports and presentations with customizable templates.'
    },
    {
      icon: Icons.Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security ensures your sensitive business data remains protected.'
    },
    {
      icon: Icons.Users,
      title: 'Team Collaboration',
      description: 'Share insights and collaborate with stakeholders through secure dashboard sharing.'
    }
  ];

  const useCases = [
    'Sales Performance Analysis',
    'Financial Reporting & KPI Tracking',
    'Customer Behavior Analytics',
    'Market Research Data Analysis',
    'Operational Efficiency Metrics',
    'Budget vs Actual Reporting'
  ];

  return (
    <>
      <SEOHead
        pageKey="business-analysts"
        customTitle="CSV Analytics for Business Analysts - Professional Data Visualization & BI Tools"
        customDescription="Empower your business analysis with professional CSV analytics tools. Create stunning dashboards, analyze trends, and generate executive reports from spreadsheet data. Free trial available."
        customKeywords="business analyst tools, csv analytics, data visualization for business, business intelligence dashboard, spreadsheet analysis, professional reporting tools"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'CSV Analytics for Business Analysts',
          description: 'Professional data visualization and business intelligence tools for business analysts',
          audience: {
            '@type': 'Audience',
            audienceType: 'Business Analysts'
          },
          mainEntity: {
            '@type': 'SoftwareApplication',
            name: 'CSV Analytics Studio',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser'
          }
        }}
      />

      <div className="min-h-screen bg-[#FAFFCA]">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-[#5A827E] mb-6">
              Professional CSV Analytics for <span className="text-[#84AE92]">Business Analysts</span>
            </h1>
            <p className="text-xl text-[#5A827E]/80 mb-8 max-w-3xl mx-auto">
              Transform your spreadsheet data into powerful business insights. Create professional dashboards, 
              analyze trends, and generate executive-ready reports with our advanced CSV analytics platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                to="/app"
                variant="primary"
                size="lg"
                icon={Icons.ArrowRight}
                iconPosition="right"
                className="px-8 py-4"
              >
                Start Free Analysis
              </Button>
              <Button
                as={Link}
                to="/demo"
                variant="outline"
                size="lg"
                icon={Icons.Play}
                className="px-8 py-4"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#5A827E] mb-4">
                Powerful Features for Business Intelligence
              </h2>
              <p className="text-lg text-[#5A827E]/70 max-w-2xl mx-auto">
                Everything you need to turn raw CSV data into actionable business insights
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-[#B9D4AA]/20 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-[#5A827E]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#5A827E]">{feature.title}</h3>
                    </div>
                    <p className="text-[#5A827E]/70">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 px-4 bg-[#FAFFCA]/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-[#5A827E] mb-6">
                  Perfect for Every Business Analysis Need
                </h2>
                <p className="text-lg text-[#5A827E]/70 mb-8">
                  From sales performance tracking to financial reporting, our CSV analytics platform 
                  handles all your business intelligence requirements with professional-grade tools.
                </p>
                <div className="space-y-3">
                  {useCases.map((useCase, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Icons.Check className="w-5 h-5 text-[#84AE92]" />
                      <span className="text-[#5A827E]">{useCase}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-[#5A827E] mb-4">
                  Start Your Free Trial Today
                </h3>
                <p className="text-[#5A827E]/70 mb-6">
                  Join thousands of business analysts who trust our platform for their data analysis needs.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span className="text-sm text-[#5A827E]">No credit card required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span className="text-sm text-[#5A827E]">Full feature access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icons.Check className="w-4 h-4 text-[#84AE92]" />
                    <span className="text-sm text-[#5A827E]">Expert support included</span>
                  </div>
                  <Button
                    as={Link}
                    to="/app"
                    variant="primary"
                    className="w-full mt-6"
                    icon={Icons.ArrowRight}
                    iconPosition="right"
                  >
                    Get Started Free
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-[#5A827E] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Data Analysis?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join the thousands of business analysts who rely on our platform for professional data insights.
            </p>
            <Button
              as={Link}
              to="/app"
              variant="secondary"
              size="lg"
              icon={Icons.ArrowRight}
              iconPosition="right"
              className="px-8 py-4"
            >
              Start Free Trial
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default BusinessAnalystsLanding;
