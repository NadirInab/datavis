import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Button, { Icons } from '../components/ui/Button';
import { FeatureCard } from '../components/ui/Card';
import { FeatureModal } from '../components/ui/Modal';
import { useAuth } from '../context/FirebaseAuthContext';
import SEOHead from '../components/SEO/SEOHead';
import AnimatedHero from '../components/landing/AnimatedHero';
import ModernPricing from '../components/landing/ModernPricing';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import { FAQSection, SEOFeatureSection } from '../components/SEO/EnhancedSEO';
import { generateSiteStructuredData } from '../utils/sitemap';
import SEOMonitor from '../components/SEO/SEOMonitor';

// Animated Chart Components
const AnimatedBarChart = ({ cycle }) => {
  const bars = [
    { height: 40, value: 85 },
    { height: 60, value: 92 },
    { height: 80, value: 78 },
    { height: 50, value: 96 },
    { height: 70, value: 88 }
  ];

  return (
    <div className="flex items-end justify-center space-x-1 h-full">
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          className="w-2 rounded-sm bg-gradient-to-t from-primary-600 to-primary-400"
          initial={{ height: 0 }}
          animate={{
            height: `${bar.height + (cycle * 5)}%`,
            backgroundColor: cycle % 2 === 0 ? '#5A827E' : '#84AE92'
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.1,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

const AnimatedLineChart = ({ cycle }) => {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 2, ease: "easeInOut" }
    }
  };

  return (
    <div className="w-full h-full flex items-center">
      <svg className="w-full h-full" viewBox="0 0 80 40">
        <motion.path
          d={cycle % 2 === 0 ? "M 5,30 Q 20,15 35,20 T 75,10" : "M 5,25 Q 20,10 35,15 T 75,5"}
          stroke="#84AE92"
          strokeWidth="2"
          fill="none"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
        />
        <motion.circle
          cx="75"
          cy={cycle % 2 === 0 ? "10" : "5"}
          r="2"
          fill="#B9D4AA"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};

const AnimatedPieChart = ({ cycle }) => {
  const segments = [
    { value: 40, color: '#5A827E', offset: 0 },
    { value: 30, color: '#84AE92', offset: 40 },
    { value: 20, color: '#B9D4AA', offset: 70 },
    { value: 10, color: '#FAFFCA', offset: 90 }
  ];

  return (
    <div className="flex justify-center h-full items-center">
      <svg className="w-12 h-12" viewBox="0 0 42 42">
        {segments.map((segment, index) => (
          <motion.circle
            key={index}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={segment.color}
            strokeWidth="3"
            strokeDasharray={`${segment.value} ${100 - segment.value}`}
            strokeDashoffset={100 - segment.offset}
            initial={{ strokeDasharray: "0 100" }}
            animate={{
              strokeDasharray: `${segment.value + (cycle * 2)} ${100 - (segment.value + (cycle * 2))}`,
              rotate: cycle * 90
            }}
            transition={{ duration: 1, delay: index * 0.2 }}
            style={{ transformOrigin: '21px 21px' }}
          />
        ))}
      </svg>
    </div>
  );
};

const AnimatedHeatmap = ({ cycle }) => {
  const cells = Array.from({ length: 16 }, (_, i) => ({
    intensity: Math.random(),
    delay: i * 0.05
  }));

  return (
    <div className="grid grid-cols-4 gap-1 h-full w-full">
      {cells.map((cell, index) => (
        <motion.div
          key={index}
          className="rounded-sm"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: cell.intensity + (cycle * 0.1),
            scale: 1,
            backgroundColor: `rgba(90, 130, 126, ${cell.intensity + (cycle * 0.1)})`
          }}
          transition={{ duration: 0.5, delay: cell.delay }}
        />
      ))}
    </div>
  );
};

const AnimatedScatterPlot = ({ cycle }) => {
  const points = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random() * 70 + 5,
    y: Math.random() * 30 + 5,
    size: Math.random() * 3 + 1
  }));

  return (
    <div className="w-full h-full flex items-center">
      <svg className="w-full h-full" viewBox="0 0 80 40">
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={point.size}
            fill="#84AE92"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 0.7,
              scale: 1 + (cycle * 0.2),
              fill: cycle % 2 === 0 ? '#84AE92' : '#B9D4AA'
            }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        ))}
      </svg>
    </div>
  );
};

const AnimatedAreaChart = ({ cycle }) => {
  return (
    <div className="w-full h-full flex items-center">
      <svg className="w-full h-full" viewBox="0 0 80 40">
        <motion.path
          d={cycle % 2 === 0 ? "M 5,35 Q 20,20 35,25 T 75,15 L 75,35 L 5,35 Z" : "M 5,35 Q 20,15 35,20 T 75,10 L 75,35 L 5,35 Z"}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1 }}
        />
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#84AE92" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#84AE92" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const AnimatedGaugeChart = ({ cycle }) => {
  const value = 75 + (cycle * 5);
  const circumference = 2 * Math.PI * 15;
  const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;

  return (
    <div className="flex justify-center h-full items-center">
      <svg className="w-12 h-12" viewBox="0 0 42 42">
        <circle
          cx="21"
          cy="21"
          r="15"
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <motion.circle
          cx="21"
          cy="21"
          r="15"
          fill="transparent"
          stroke="#5A827E"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ strokeDasharray: "0 94.2" }}
          animate={{ strokeDasharray }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformOrigin: '21px 21px', transform: 'rotate(-90deg)' }}
        />
        <text x="21" y="25" textAnchor="middle" className="text-xs font-bold fill-primary-700">
          {Math.round(value)}%
        </text>
      </svg>
    </div>
  );
};

const AnimatedDataTable = ({ cycle }) => {
  const data = [
    { label: 'Sales', value: 142 + (cycle * 10) },
    { label: 'Users', value: 89 + (cycle * 5) },
    { label: 'Revenue', value: 67 + (cycle * 8) }
  ];

  return (
    <div className="space-y-1 h-full flex flex-col justify-center">
      {data.map((item, index) => (
        <motion.div
          key={index}
          className="flex justify-between text-xs"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <span className="text-primary-600">{item.label}</span>
          <motion.span
            className="text-primary-800 font-medium"
            animate={{ color: cycle % 2 === 0 ? '#2d3c3b' : '#84AE92' }}
          >
            {item.value}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
};

// Enhanced Visualizations Grid Component
const EnhancedVisualizationsGrid = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const [hoveredCard, setHoveredCard] = useState(null);
  const [animationCycle, setAnimationCycle] = useState(0);

  // Cycle through different data animations
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationCycle(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const visualizationTypes = [
    {
      id: 'bar',
      title: 'Bar Charts',
      description: 'Compare categories and values',
      color: 'primary',
      component: <AnimatedBarChart cycle={animationCycle} />
    },
    {
      id: 'line',
      title: 'Line Charts',
      description: 'Track trends over time',
      color: 'secondary',
      component: <AnimatedLineChart cycle={animationCycle} />
    },
    {
      id: 'pie',
      title: 'Pie Charts',
      description: 'Show proportions and percentages',
      color: 'accent',
      component: <AnimatedPieChart cycle={animationCycle} />
    },
    {
      id: 'heatmap',
      title: 'Heatmaps',
      description: 'Visualize data density patterns',
      color: 'highlight',
      component: <AnimatedHeatmap cycle={animationCycle} />
    },
    {
      id: 'scatter',
      title: 'Scatter Plots',
      description: 'Explore data correlations',
      color: 'primary',
      component: <AnimatedScatterPlot cycle={animationCycle} />
    },
    {
      id: 'area',
      title: 'Area Charts',
      description: 'Show cumulative data trends',
      color: 'secondary',
      component: <AnimatedAreaChart cycle={animationCycle} />
    },
    {
      id: 'gauge',
      title: 'Gauge Charts',
      description: 'Display KPIs and metrics',
      color: 'accent',
      component: <AnimatedGaugeChart cycle={animationCycle} />
    },
    {
      id: 'table',
      title: 'Data Tables',
      description: 'Organize and sort your data',
      color: 'highlight',
      component: <AnimatedDataTable cycle={animationCycle} />
    }
  ];

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full"
    >
      {visualizationTypes.map((viz, index) => (
        <motion.div
          key={viz.id}
          variants={cardVariants}
          className={`group relative backdrop-blur-sm rounded-xl p-4 border cursor-pointer overflow-hidden transition-all duration-500 ${
            hoveredCard === viz.id ? 'shadow-xl scale-105' : 'shadow-sm hover:shadow-lg'
          }`}
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(${getColorRgb(viz.color)}, 0.1))`,
            borderColor: `rgba(${getColorRgb(viz.color)}, 0.3)`
          }}
          onMouseEnter={() => setHoveredCard(viz.id)}
          onMouseLeave={() => setHoveredCard(null)}
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative z-10">
            <div className="text-center mb-3">
              <h4 className={`text-sm font-semibold text-${viz.color}-800 mb-1`}>
                {viz.title}
              </h4>
              <p className={`text-xs text-${viz.color}-600 opacity-80`}>
                {viz.description}
              </p>
            </div>

            <div className="h-16 flex items-center justify-center mb-3">
              {viz.component}
            </div>

            {/* Interactive indicator */}
            <motion.div
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ backgroundColor: `rgba(${getColorRgb(viz.color)}, 0.6)` }}
              animate={{
                scale: hoveredCard === viz.id ? [1, 1.5, 1] : 1,
                opacity: hoveredCard === viz.id ? [0.6, 1, 0.6] : 0.6
              }}
              transition={{ duration: 1, repeat: hoveredCard === viz.id ? Infinity : 0 }}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Helper function to get RGB values for colors
const getColorRgb = (colorName) => {
  const colors = {
    primary: '90, 130, 126',    // #5A827E
    secondary: '132, 174, 146', // #84AE92
    accent: '185, 212, 170',    // #B9D4AA
    highlight: '250, 255, 202'  // #FAFFCA
  };
  return colors[colorName] || colors.primary;
};

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
        customKeywords="csv analytics dashboard, data visualization tool, business intelligence software, spreadsheet analysis, csv dashboard creator, online data analysis, business analytics platform, csv chart generator, data visualization for business, excel alternative, sales analytics dashboard, financial data visualization, marketing metrics dashboard"
        structuredData={generateSiteStructuredData()}
      />

      {/* <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, #FAFFCA, #dbeeed, #c5e1cf)'
        }}
      >
        </div> */}
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

        <AnimatedHero />

        <section
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
          itemScope
          itemType="https://schema.org/WebPageElement"
        >
          <article className="mt-16 relative">
            <div
              id="upload-demo"
              className="backdrop-blur-sm rounded-3xl shadow-strong p-8 border max-w-5xl mx-auto ring-1"
              style={{
                background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.95), rgba(185, 221, 219, 0.6))',
                borderColor: 'rgba(107, 165, 162, 0.5)',
                ringColor: 'rgba(156, 202, 171, 0.4)'
              }}
            >
                <div
                  className="aspect-video rounded-2xl p-6 relative overflow-hidden border"
                  style={{
                    background: 'linear-gradient(to bottom right, #FAFFCA, rgba(222, 235, 199, 0.8), rgba(197, 225, 207, 0.6))',
                    borderColor: 'rgba(143, 196, 193, 0.6)'
                  }}
                >
                  <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.h3
                      className="text-2xl font-bold text-primary-800 mb-3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      Powerful Visualization Types
                    </motion.h3>
                    <motion.p
                      className="text-sm text-primary-600 mb-6 max-w-2xl mx-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      From simple bar charts to complex heatmaps, create stunning visualizations that bring your data to life.
                      Each chart type is optimized for different data stories and business insights.
                    </motion.p>
                    <motion.div
                      className="flex justify-center space-x-6 text-xs text-primary-500"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      <motion.span
                        className="flex items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-primary-400 rounded-full mr-2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        ></motion.div>
                        Interactive Charts
                      </motion.span>
                      <motion.span
                        className="flex items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-secondary-400 rounded-full mr-2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        ></motion.div>
                        Real-time Updates
                      </motion.span>
                      <motion.span
                        className="flex items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-accent-400 rounded-full mr-2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        ></motion.div>
                        Professional Quality
                      </motion.span>
                      <motion.span
                        className="flex items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-highlight-400 rounded-full mr-2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                        ></motion.div>
                        Export Ready
                      </motion.span>
                    </motion.div>
                  </motion.div>

                  <EnhancedVisualizationsGrid />

                  <motion.div
                    className="absolute bottom-6 right-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1 }}
                  >
                    <motion.button
                      onClick={() => {
                        const uploadSection = document.querySelector('.feature-section');
                        if (uploadSection) {
                          uploadSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm border border-white/20"
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        background: "linear-gradient(to right, #4a6b67, #6b9c7a)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        y: [0, -2, 0],
                      }}
                      transition={{
                        y: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    >
                      <motion.div className="flex items-center">
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Icons.ArrowRight className="w-4 h-4 mr-2" />
                        </motion.div>
                        Start Creating Now
                      </motion.div>
                    </motion.button>
                  </motion.div>
                </div>


            </div>


          </article>
        </section>
      

      <TestimonialsSection />

      
      <ModernPricing />

      <FAQSection
        faqs={[
          {
            question: 'How do I create a dashboard from CSV data?',
            answer: 'Simply upload your CSV file, and our AI-powered platform will automatically suggest the best visualization types for your data. You can then customize charts, add filters, and create professional dashboards in minutes.'
          },
          {
            question: 'What file formats are supported besides CSV?',
            answer: 'We support CSV, Excel (XLSX, XLS), TSV, and JSON formats. Our platform automatically detects data types and suggests optimal visualization approaches for each format.'
          },
          {
            question: 'Is my data secure when using CSV Analytics Studio?',
            answer: 'Yes, we use enterprise-grade security with 256-bit SSL encryption, GDPR compliance, and SOC 2 Type II certification. We have a zero data retention policy for maximum privacy protection.'
          },
          {
            question: 'Can I export my visualizations and dashboards?',
            answer: 'Absolutely! Export your charts as high-resolution PNG, PDF, SVG, or interactive HTML formats. Perfect for presentations, reports, and sharing with stakeholders.'
          },
          {
            question: 'Do you offer team collaboration features?',
            answer: 'Yes, our platform includes real-time collaboration, shared workspaces, comment systems, and role-based access control for seamless team data analysis.'
          },
          {
            question: 'What types of charts and visualizations can I create?',
            answer: 'Create bar charts, line graphs, pie charts, scatter plots, heatmaps, area charts, gauge charts, and data tables. Our platform supports over 20 different visualization types optimized for business intelligence.'
          },
          {
            question: 'Is there a free plan available?',
            answer: 'Yes! Our free plan includes basic CSV analysis, up to 5 visualizations, and standard export options. Perfect for individuals and small teams getting started with data visualization.'
          },
          {
            question: 'How does the AI-powered analysis work?',
            answer: 'Our machine learning algorithms analyze your data structure, detect patterns, and automatically recommend the most effective visualization types. This saves time and ensures optimal data presentation for business insights.'
          }
        ]}
        title="Frequently Asked Questions About CSV Analytics"
      />

      <SEOFeatureSection
        title="Industry-Leading Data Visualization Solutions"
        description="Trusted by professionals across industries for powerful CSV analytics, business intelligence dashboards, and data-driven decision making. Transform your spreadsheet data into actionable insights."
        keywords={[
          'sales analytics dashboard',
          'financial data visualization',
          'marketing metrics dashboard',
          'hr analytics platform',
          'operations dashboard creator',
          'business intelligence software',
          'data visualization for business',
          'csv analytics tool'
        ]}
        features={[
          {
            title: 'Sales Analytics Dashboard',
            description: 'Track sales performance, revenue trends, and customer metrics with interactive dashboards. Perfect for sales teams, managers, and executives.',
            benefits: [
              'Real-time sales performance tracking',
              'Customer acquisition cost analysis',
              'Revenue forecasting and trends',
              'Territory and rep performance comparison'
            ]
          },
          {
            title: 'Financial Data Visualization',
            description: 'Create professional financial reports, budget analysis, and expense tracking dashboards from your CSV data.',
            benefits: [
              'P&L statement visualization',
              'Budget vs actual analysis',
              'Cash flow tracking',
              'Financial KPI monitoring'
            ]
          },
          {
            title: 'Marketing Metrics Dashboard',
            description: 'Analyze campaign performance, lead generation, and ROI with comprehensive marketing analytics dashboards.',
            benefits: [
              'Campaign ROI analysis',
              'Lead conversion tracking',
              'Customer journey visualization',
              'Marketing attribution modeling'
            ]
          },
          {
            title: 'HR Analytics Platform',
            description: 'Visualize employee data, track performance metrics, and analyze workforce trends with HR-focused dashboards.',
            benefits: [
              'Employee performance tracking',
              'Turnover rate analysis',
              'Recruitment metrics',
              'Compensation analysis'
            ]
          },
          {
            title: 'Operations Dashboard',
            description: 'Monitor operational efficiency, supply chain metrics, and inventory levels with real-time operational dashboards.',
            benefits: [
              'Supply chain visibility',
              'Inventory optimization',
              'Process efficiency tracking',
              'Quality metrics monitoring'
            ]
          },
          {
            title: 'Customer Analytics',
            description: 'Understand customer behavior, satisfaction, and lifetime value through comprehensive customer analytics dashboards.',
            benefits: [
              'Customer segmentation analysis',
              'Churn prediction modeling',
              'Satisfaction score tracking',
              'Lifetime value calculation'
            ]
          }
        ]}
        className="bg-gradient-to-br from-highlight-50/30 via-white to-primary-50/20"
      />

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

      {/* <SEOMonitor pageData={{ title: 'CSV Analytics Studio', description: 'Professional data visualization platform' }} /> */}

    </React.Fragment>
  );
};

export default LandingPage;