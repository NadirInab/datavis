import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Check, Star, Zap, Crown, Shield } from 'lucide-react';

const ModernPricing = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free',
      icon: Shield,
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        'Up to 5 CSV files',
        'Basic chart types',
        'Export as PNG',
        'Community support',
        '1GB storage'
      ],
      limitations: [
        'Limited file size (10MB)',
        'Basic templates only',
        'No advanced analytics'
      ],
      buttonText: 'Get Started Free',
      buttonStyle: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
      popular: false
    },
    {
      name: 'Pro',
      icon: Zap,
      description: 'For professionals and small teams',
      monthlyPrice: 19,
      yearlyPrice: 190,
      features: [
        'Unlimited CSV files',
        'All chart types',
        'Export as PNG, PDF, SVG',
        'Priority support',
        '50GB storage',
        'Advanced analytics',
        'Custom branding',
        'API access'
      ],
      limitations: [],
      buttonText: 'Start Pro Trial',
      buttonStyle: 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl',
      popular: true
    },
    {
      name: 'Enterprise',
      icon: Crown,
      description: 'For large organizations',
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: [
        'Everything in Pro',
        'Unlimited storage',
        'White-label solution',
        'Dedicated support',
        'Custom integrations',
        'Advanced security',
        'Team collaboration',
        'SLA guarantee'
      ],
      limitations: [],
      buttonText: 'Contact Sales',
      buttonStyle: 'border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white',
      popular: false
    }
  ];

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

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section
      ref={ref}
      className="py-20"
      style={{
        background: 'linear-gradient(to bottom, #e1f0e6, #eef5e2)'
      }}
    >
      <div className="container mx-auto px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.div
            variants={cardVariants}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-full text-primary-800 font-medium mb-6 border border-primary-300/50"
          >
            <Star className="w-4 h-4 mr-2" />
            Simple, Transparent Pricing
          </motion.div>
          
          <motion.h2
            variants={cardVariants}
            className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
          >
            Choose Your Perfect Plan
          </motion.h2>
          
          <motion.p
            variants={cardVariants}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Start free and scale as you grow. All plans include our core features 
            with no hidden fees or surprise charges.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            variants={cardVariants}
            className="flex items-center justify-center space-x-4 mb-12"
          >
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <motion.button
              className="relative w-14 h-7 bg-gray-200 rounded-full p-1 transition-colors duration-300"
              style={{ backgroundColor: isYearly ? '#5A827E' : '#e5e7eb' }}
              onClick={() => setIsYearly(!isYearly)}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full shadow-md"
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {isYearly && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
              >
                Save 20%
              </motion.span>
            )}
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const originalPrice = isYearly ? plan.monthlyPrice * 12 : null;

            return (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular 
                    ? 'border-primary/20 ring-2 ring-primary/10' 
                    : 'border-white/20 hover:border-primary/20'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </motion.div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-200 to-secondary-200 rounded-2xl mb-4">
                    <Icon className="w-8 h-8 text-primary-700" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-600 ml-2">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    
                    {isYearly && originalPrice && (
                      <div className="text-sm text-gray-500">
                        <span className="line-through">${originalPrice}/year</span>
                        <span className="text-green-600 ml-2 font-medium">
                          Save ${originalPrice - price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * featureIndex }}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                  
                  {plan.limitations.map((limitation, limitIndex) => (
                    <motion.div
                      key={limitIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * (plan.features.length + limitIndex) }}
                      className="flex items-center space-x-3 opacity-60"
                    >
                      <div className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      </div>
                      <span className="text-gray-500 text-sm">{limitation}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${plan.buttonStyle}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {plan.buttonText}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-4">
            Need a custom solution? We're here to help.
          </p>
          <motion.button
            className="text-primary font-semibold hover:text-secondary transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact our sales team →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default ModernPricing;
