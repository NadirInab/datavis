import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, PieChart, LineChart, Database, Zap } from 'lucide-react';

const AnimatedHero = () => {
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const [currentDataPoint, setCurrentDataPoint] = useState(0);
  const dataPoints = [
    { value: 85, label: 'Sales Growth', color: '#5A827E' },
    { value: 92, label: 'User Engagement', color: '#84AE92' },
    { value: 78, label: 'Revenue Increase', color: '#B9D4AA' },
    { value: 96, label: 'Data Accuracy', color: '#FAFFCA' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDataPoint((prev) => (prev + 1) % dataPoints.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStartVisualizingClick = () => {
    // Navigate to dashboard as a guest user
    navigate('/app');
  };

  const handleWatchDemoClick = () => {
    // Scroll to the demo preview section on the landing page
    const demoSection = document.getElementById('upload-demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section
      ref={ref}
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, #deebc7, #dbeeed, #c5e1cf)'
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Data Points */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: 'rgba(45, 60, 59, 0.4)'
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 rounded-full blur-3xl"
          style={{
            background: 'linear-gradient(to right, rgba(143, 196, 193, 0.3), rgba(156, 202, 171, 0.3))'
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-48 h-48 rounded-full blur-3xl"
          style={{
            background: 'linear-gradient(to right, rgba(199, 219, 162, 0.3), rgba(250, 255, 202, 0.4))'
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <motion.div
                className="inline-flex items-center px-4 py-2 rounded-full font-medium border"
                style={{
                  background: 'linear-gradient(to right, #b9dddb, #c5e1cf)',
                  color: '#334746',
                  borderColor: 'rgba(143, 196, 193, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-4 h-4 mr-2" />
                Transform Data Into Insights
              </motion.div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Turn Your{' '}
                <span
                  className="font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #2d3c3b, #334746)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  CSV Data
                </span>{' '}
                Into Beautiful{' '}
                <span
                  className="font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #30493a, #3a5c48)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Visualizations
                </span>
              </h1>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 leading-relaxed max-w-2xl"
            >
              Upload your CSV files and instantly create stunning charts, graphs, and dashboards. 
              No coding required. No complex setup. Just beautiful data visualization in seconds.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <motion.button
                className="px-8 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #2d3c3b, #334746)',
                  color: 'white'
                }}
                onClick={handleStartVisualizingClick}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Visualizing Now
              </motion.button>

              <motion.button
                className="px-8 py-4 border-2 font-semibold rounded-xl transition-all duration-300"
                style={{
                  borderColor: '#2d3c3b',
                  color: '#2d3c3b',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}
                onClick={handleWatchDemoClick}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                  backgroundColor: '#2d3c3b',
                  color: 'white'
                }}
                whileTap={{ scale: 0.95 }}
              >
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200"
            >
              {[
                { number: '10K+', label: 'Files Processed' },
                { number: '50K+', label: 'Charts Created' },
                { number: '99.9%', label: 'Uptime' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl font-bold" style={{ color: '#2d3c3b' }}>{stat.number}</div>
                  <div className="text-sm" style={{ color: '#334746' }}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Animated Data Visualization */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="relative"
          >
            {/* Main Chart Container */}
            <motion.div
              variants={itemVariants}
              className="relative backdrop-blur-sm rounded-3xl p-8 shadow-2xl border"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(45, 60, 59, 0.2)'
              }}
            >
              {/* Chart Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: '#2d3c3b' }}>Live Data Insights</h3>
                <div className="flex space-x-2">
                  <BarChart3 className="w-5 h-5" style={{ color: '#2d3c3b' }} />
                  <TrendingUp className="w-5 h-5" style={{ color: '#334746' }} />
                  <PieChart className="w-5 h-5" style={{ color: '#30493a' }} />
                </div>
              </div>

              {/* Animated Chart */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentDataPoint}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#334746' }}>
                        {dataPoints[currentDataPoint].label}
                      </span>
                      <span className="text-lg font-bold" style={{ color: '#2d3c3b' }}>
                        {dataPoints[currentDataPoint].value}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        className="h-3 rounded-full"
                        style={{ backgroundColor: dataPoints[currentDataPoint].color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${dataPoints[currentDataPoint].value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Mini Charts */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {[1, 2, 3, 4].map((_, index) => (
                    <motion.div
                      key={index}
                      variants={floatingVariants}
                      animate="animate"
                      className="p-4 rounded-xl border"
                      style={{
                        animationDelay: `${index * 0.5}s`,
                        background: 'linear-gradient(to bottom right, #f9fafb, #ffffff)',
                        borderColor: 'rgba(45, 60, 59, 0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: '#2d3c3b' }}
                        ></div>
                        <span className="text-xs" style={{ color: '#334746' }}>Dataset {index + 1}</span>
                      </div>
                      <div className="flex space-x-1">
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 rounded-full"
                            style={{
                              height: `${Math.random() * 20 + 10}px`,
                              backgroundColor: 'rgba(45, 60, 59, 0.3)'
                            }}
                            animate={{
                              height: [`${Math.random() * 20 + 10}px`, `${Math.random() * 20 + 10}px`],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating Icons */}
            {[Database, LineChart, BarChart3, PieChart].map((Icon, index) => (
              <motion.div
                key={index}
                className="absolute w-12 h-12 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center"
                style={{
                  top: `${20 + index * 15}%`,
                  right: `${-5 + (index % 2) * 10}%`,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(45, 60, 59, 0.2)'
                }}
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3 + index * 0.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                whileHover={{ scale: 1.1 }}
              >
                <Icon className="w-6 h-6" style={{ color: '#2d3c3b' }} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedHero;
