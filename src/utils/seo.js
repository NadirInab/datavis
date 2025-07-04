// SEO Utility Functions and Configuration
export const SEO_CONFIG = {
  // Primary Keywords (High-value, medium competition)
  primaryKeywords: [
    'csv analytics dashboard',
    'data visualization tool',
    'spreadsheet analysis software',
    'business intelligence dashboard',
    'csv data processing'
  ],
  
  // Secondary Keywords (Long-tail, low competition)
  secondaryKeywords: [
    'online csv analyzer',
    'free data visualization tool',
    'csv file dashboard creator',
    'business data analytics platform',
    'spreadsheet data insights',
    'csv chart generator',
    'data analysis dashboard',
    'excel alternative online',
    'csv reporting tool',
    'data visualization for business'
  ],

  // Site-wide SEO defaults
  site: {
    name: 'CSV Analytics Studio',
    tagline: 'Transform Your Data Into Insights',
    description: 'Professional CSV analytics and data visualization platform. Create stunning dashboards, analyze spreadsheet data, and generate business insights with our powerful online tools.',
    url: 'https://csvanalytics.studio', // Update with your actual domain
    image: '/images/og-image.jpg',
    twitterHandle: '@csvanalytics',
    author: 'CSV Analytics Studio Team',
    type: 'website',
    locale: 'en_US'
  },

  // Page-specific SEO configurations
  pages: {
    home: {
      title: 'CSV Analytics Studio - Professional Data Visualization & Business Intelligence Dashboard',
      description: 'Transform your CSV files into powerful business insights. Create interactive dashboards, analyze spreadsheet data, and visualize trends with our professional analytics platform. Free trial available.',
      keywords: 'csv analytics, data visualization, business intelligence dashboard, spreadsheet analysis, data processing tool',
      canonical: '/',
      schema: 'WebApplication'
    },
    
    features: {
      title: 'Advanced CSV Analytics Features - Data Visualization & Business Intelligence Tools',
      description: 'Discover powerful features for CSV analysis: interactive charts, real-time dashboards, data filtering, export options, and advanced visualization tools for business intelligence.',
      keywords: 'csv features, data visualization tools, business analytics, spreadsheet analysis features, dashboard creation',
      canonical: '/features',
      schema: 'WebPage'
    },

    pricing: {
      title: 'CSV Analytics Pricing - Affordable Data Visualization Plans for Every Business',
      description: 'Choose the perfect plan for your data analysis needs. From free CSV analytics to enterprise business intelligence solutions. Transparent pricing, no hidden fees.',
      keywords: 'csv analytics pricing, data visualization plans, business intelligence cost, spreadsheet analysis pricing',
      canonical: '/pricing',
      schema: 'PriceSpecification'
    },

    dashboard: {
      title: 'CSV Dashboard - Create Interactive Data Visualizations & Business Reports',
      description: 'Build professional dashboards from your CSV data. Create charts, analyze trends, and generate business insights with our intuitive dashboard builder.',
      keywords: 'csv dashboard, data visualization dashboard, business intelligence, spreadsheet dashboard, analytics platform',
      canonical: '/dashboard',
      schema: 'WebApplication'
    },

    upload: {
      title: 'Upload CSV Files - Start Your Data Analysis & Visualization Journey',
      description: 'Upload your CSV files securely and start creating powerful data visualizations. Support for large files, multiple formats, and instant analysis.',
      keywords: 'upload csv, csv file analysis, data upload, spreadsheet analysis, file processing',
      canonical: '/upload',
      schema: 'WebPage'
    },

    blog: {
      title: 'Data Analytics Blog - CSV Tips, Visualization Guides & Business Intelligence Insights',
      description: 'Expert insights on data analysis, CSV processing tips, visualization best practices, and business intelligence strategies. Learn from data professionals.',
      keywords: 'data analytics blog, csv tips, visualization guides, business intelligence insights, data analysis tutorials',
      canonical: '/blog',
      schema: 'Blog'
    }
  }
};

// Generate meta tags for a specific page
export const generateMetaTags = (pageKey, customData = {}) => {
  const siteConfig = SEO_CONFIG.site;
  const pageConfig = SEO_CONFIG.pages[pageKey] || SEO_CONFIG.pages.home;
  
  const meta = {
    title: customData.title || pageConfig.title,
    description: customData.description || pageConfig.description,
    keywords: customData.keywords || pageConfig.keywords,
    canonical: customData.canonical || pageConfig.canonical,
    image: customData.image || siteConfig.image,
    url: `${siteConfig.url}${pageConfig.canonical}`,
    ...customData
  };

  return {
    // Basic meta tags
    title: meta.title,
    meta: [
      { name: 'description', content: meta.description },
      { name: 'keywords', content: meta.keywords },
      { name: 'author', content: siteConfig.author },
      { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'googlebot', content: 'index, follow' },
      
      // Open Graph tags
      { property: 'og:type', content: siteConfig.type },
      { property: 'og:title', content: meta.title },
      { property: 'og:description', content: meta.description },
      { property: 'og:image', content: `${siteConfig.url}${meta.image}` },
      { property: 'og:url', content: meta.url },
      { property: 'og:site_name', content: siteConfig.name },
      { property: 'og:locale', content: siteConfig.locale },
      
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: siteConfig.twitterHandle },
      { name: 'twitter:creator', content: siteConfig.twitterHandle },
      { name: 'twitter:title', content: meta.title },
      { name: 'twitter:description', content: meta.description },
      { name: 'twitter:image', content: `${siteConfig.url}${meta.image}` },
      
      // Additional SEO tags
      { name: 'theme-color', content: '#5A827E' },
      { name: 'msapplication-TileColor', content: '#5A827E' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    
    // Link tags
    link: [
      { rel: 'canonical', href: meta.url },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'manifest', href: '/site.webmanifest' }
    ]
  };
};

// Generate structured data (JSON-LD)
export const generateStructuredData = (pageKey, customData = {}) => {
  const siteConfig = SEO_CONFIG.site;
  const pageConfig = SEO_CONFIG.pages[pageKey] || SEO_CONFIG.pages.home;
  
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': pageConfig.schema || 'WebPage',
    name: customData.title || pageConfig.title,
    description: customData.description || pageConfig.description,
    url: `${siteConfig.url}${pageConfig.canonical}`,
    image: `${siteConfig.url}${customData.image || siteConfig.image}`,
    author: {
      '@type': 'Organization',
      name: siteConfig.author,
      url: siteConfig.url
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`
      }
    }
  };

  // Add specific schema based on page type
  switch (pageConfig.schema) {
    case 'WebApplication':
      return {
        ...baseSchema,
        '@type': 'WebApplication',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        featureList: [
          'CSV Data Analysis',
          'Interactive Dashboards',
          'Data Visualization',
          'Business Intelligence',
          'Report Generation'
        ]
      };
      
    case 'PriceSpecification':
      return {
        ...baseSchema,
        '@type': 'Product',
        name: 'CSV Analytics Studio',
        category: 'Software',
        offers: [
          {
            '@type': 'Offer',
            name: 'Free Plan',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
          },
          {
            '@type': 'Offer',
            name: 'Pro Plan',
            price: '29',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
          }
        ]
      };
      
    case 'Blog':
      return {
        ...baseSchema,
        '@type': 'Blog',
        blogPost: customData.posts || []
      };
      
    default:
      return baseSchema;
  }
};

// SEO-friendly URL generator
export const generateSEOUrl = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Keyword density checker
export const checkKeywordDensity = (content, keyword) => {
  const words = content.toLowerCase().split(/\s+/);
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word => 
    keywordWords.some(kw => word.includes(kw))
  ).length;
  
  return {
    density: (keywordCount / words.length) * 100,
    count: keywordCount,
    totalWords: words.length,
    optimal: keywordCount / words.length >= 0.01 && keywordCount / words.length <= 0.03
  };
};

// Generate breadcrumb structured data
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SEO_CONFIG.site.url}${crumb.url}`
    }))
  };
};
