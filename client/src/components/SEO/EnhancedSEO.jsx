import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { generateFAQSchema, generateSoftwareSchema, generateOrganizationSchema } from '../../utils/seo';

// FAQ Section Component with SEO optimization
export const FAQSection = ({ faqs, title = "Frequently Asked Questions" }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const [openItems, setOpenItems] = React.useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section 
      ref={ref}
      className="py-16 bg-gradient-to-br from-white via-highlight-50/20 to-secondary-50/30"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold text-primary-900 mb-4"
          >
            {title}
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-lg text-primary-600 max-w-2xl mx-auto"
          >
            Get answers to common questions about CSV analytics, data visualization, and our platform features.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="backdrop-blur-sm rounded-xl border border-primary-200/60 overflow-hidden"
              style={{
                background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(185, 221, 219, 0.3))'
              }}
              itemScope
              itemType="https://schema.org/Question"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-primary-50/50 transition-colors duration-200"
                aria-expanded={openItems.has(index)}
              >
                <h3 
                  className="text-lg font-semibold text-primary-800 pr-4"
                  itemProp="name"
                >
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openItems.has(index) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDownIcon className="w-5 h-5 text-primary-600" />
                </motion.div>
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openItems.has(index) ? 'auto' : 0,
                  opacity: openItems.has(index) ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
                itemScope
                itemType="https://schema.org/Answer"
              >
                <div className="px-6 pb-4">
                  <p 
                    className="text-primary-700 leading-relaxed"
                    itemProp="text"
                  >
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQSchema(faqs))
        }}
      />
    </section>
  );
};

// SEO-optimized Feature Section
export const SEOFeatureSection = ({ 
  title, 
  description, 
  features, 
  keywords = [],
  className = "" 
}) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

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

  return (
    <section 
      ref={ref}
      className={`py-16 ${className}`}
      itemScope
      itemType="https://schema.org/WebPageElement"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold text-primary-900 mb-6"
            itemProp="name"
          >
            {title}
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-xl text-primary-600 max-w-3xl mx-auto leading-relaxed"
            itemProp="description"
          >
            {description}
          </motion.p>
          
          {/* SEO Keywords (hidden) */}
          <div className="sr-only" itemProp="keywords">
            {keywords.join(', ')}
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative backdrop-blur-sm rounded-xl p-6 border border-primary-200/60 hover:shadow-lg transition-all duration-300"
              style={{
                background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.95), rgba(185, 221, 219, 0.3))'
              }}
              itemScope
              itemType="https://schema.org/Thing"
            >
              <div className="flex items-center mb-4">
                {feature.icon && (
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center mr-4">
                    <feature.icon className="w-6 h-6 text-primary-600" />
                  </div>
                )}
                <h3 
                  className="text-xl font-semibold text-primary-800"
                  itemProp="name"
                >
                  {feature.title}
                </h3>
              </div>
              <p 
                className="text-primary-700 leading-relaxed"
                itemProp="description"
              >
                {feature.description}
              </p>
              
              {feature.benefits && (
                <ul className="mt-4 space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li 
                      key={benefitIndex}
                      className="flex items-center text-sm text-primary-600"
                    >
                      <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// SEO-optimized Hero Section
export const SEOHeroSection = ({ 
  h1, 
  description, 
  keywords = [], 
  ctaText = "Get Started", 
  ctaAction,
  children 
}) => {
  return (
    <section 
      className="relative"
      itemScope
      itemType="https://schema.org/WebPageElement"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 
            className="text-4xl md:text-6xl font-bold text-primary-900 mb-6"
            itemProp="headline"
          >
            {h1}
          </h1>
          <p 
            className="text-xl text-primary-600 max-w-3xl mx-auto mb-8 leading-relaxed"
            itemProp="description"
          >
            {description}
          </p>
          
          {/* SEO Keywords (hidden) */}
          <div className="sr-only" itemProp="keywords">
            {keywords.join(', ')}
          </div>
          
          {ctaAction && (
            <motion.button
              onClick={ctaAction}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {ctaText}
            </motion.button>
          )}
        </div>
        
        {children}
      </div>
    </section>
  );
};

export default {
  FAQSection,
  SEOFeatureSection,
  SEOHeroSection
};
