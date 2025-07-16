// SEO Utility Functions and Configuration
export const SEO_CONFIG = {
  // Primary Keywords (High-value, medium competition)
  primaryKeywords: [
    'csv analytics dashboard',
    'data visualization tool',
    'spreadsheet analysis software',
    'business intelligence dashboard',
    'csv data processing',
    'online data analysis platform',
    'csv dashboard creator',
    'business analytics software'
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

  // Long-tail Keywords (High conversion, low competition)
  longTailKeywords: [
    'convert csv to charts online',
    'business data visualization software',
    'csv dashboard creator free',
    'sales analytics dashboard tool',
    'financial data visualization platform',
    'marketing metrics dashboard creator',
    'spreadsheet to dashboard converter',
    'csv file analysis online free',
    'business intelligence dashboard maker',
    'data visualization tool for small business',
    'csv analytics for marketing teams',
    'financial reporting dashboard tool',
    'sales data visualization software',
    'customer analytics dashboard platform',
    'inventory management dashboard csv',
    'hr analytics dashboard creator',
    'project management data visualization',
    'ecommerce analytics dashboard tool'
  ],

  // Industry-specific Keywords
  industryKeywords: {
    sales: [
      'sales analytics dashboard',
      'sales performance visualization',
      'sales reporting tool',
      'crm data visualization',
      'sales metrics dashboard'
    ],
    finance: [
      'financial data visualization',
      'financial reporting dashboard',
      'budget analysis tool',
      'financial metrics visualization',
      'accounting dashboard creator'
    ],
    marketing: [
      'marketing analytics dashboard',
      'campaign performance visualization',
      'marketing metrics tool',
      'digital marketing dashboard',
      'social media analytics visualization'
    ],
    hr: [
      'hr analytics dashboard',
      'employee data visualization',
      'workforce analytics tool',
      'hr metrics dashboard',
      'people analytics platform'
    ],
    operations: [
      'operations dashboard creator',
      'supply chain visualization',
      'inventory analytics dashboard',
      'logistics data visualization',
      'operational metrics tool'
    ]
  },

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
      keywords: 'csv analytics dashboard, data visualization tool, business intelligence software, spreadsheet analysis, csv dashboard creator, online data analysis, business analytics platform, csv chart generator, data visualization for business, excel alternative',
      canonical: '/',
      schema: 'WebApplication',
      h1: 'Transform Your CSV Data Into Beautiful Visualizations',
      h2: [
        'Professional Data Visualization Made Simple',
        'Powerful Analytics Features for Every Business',
        'Trusted by Enterprise Customers Worldwide'
      ],
      faq: [
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
        }
      ]
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

// Generate FAQ structured data
export const generateFAQSchema = (faqs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

// Generate Software Application structured data
export const generateSoftwareSchema = (appData) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: appData.name || 'CSV Analytics Studio',
    description: appData.description || 'Professional data visualization and business intelligence platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    url: SEO_CONFIG.site.url,
    author: {
      '@type': 'Organization',
      name: SEO_CONFIG.site.author
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1247',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: [
      'CSV Data Analysis',
      'Interactive Dashboard Creation',
      'Real-time Data Visualization',
      'Business Intelligence Reports',
      'Team Collaboration Tools',
      'Data Export & Sharing',
      'Advanced Analytics',
      'Custom Chart Builder'
    ]
  };
};

// Generate Organization structured data
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.site.name,
    url: SEO_CONFIG.site.url,
    logo: `${SEO_CONFIG.site.url}/logo.png`,
    description: SEO_CONFIG.site.description,
    foundingDate: '2024',
    sameAs: [
      'https://twitter.com/csvanalytics',
      'https://linkedin.com/company/csvanalytics',
      'https://github.com/csvanalytics'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@csvanalytics.studio',
      availableLanguage: 'English'
    }
  };
};

// Generate Review/Testimonial structured data
export const generateReviewSchema = (reviews) => {
  return reviews.map(review => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: '5'
    },
    reviewBody: review.text,
    datePublished: review.date
  }));
};

// SEO Content Optimization
export const optimizeContentForSEO = (content, targetKeywords) => {
  const suggestions = [];

  // Check title length
  if (content.title.length < 30 || content.title.length > 60) {
    suggestions.push({
      type: 'title',
      message: 'Title should be between 30-60 characters for optimal SEO',
      current: content.title.length
    });
  }

  // Check description length
  if (content.description.length < 120 || content.description.length > 160) {
    suggestions.push({
      type: 'description',
      message: 'Meta description should be between 120-160 characters',
      current: content.description.length
    });
  }

  // Check keyword density
  targetKeywords.forEach(keyword => {
    const density = checkKeywordDensity(content.body || '', keyword);
    if (!density.optimal) {
      suggestions.push({
        type: 'keyword',
        message: `Keyword "${keyword}" density is ${density.density.toFixed(2)}% (optimal: 1-3%)`,
        keyword,
        density: density.density
      });
    }
  });

  return suggestions;
};

// Generate sitemap data
export const generateSitemapData = () => {
  const pages = Object.keys(SEO_CONFIG.pages).map(pageKey => ({
    url: `${SEO_CONFIG.site.url}${SEO_CONFIG.pages[pageKey].canonical}`,
    lastmod: new Date().toISOString(),
    changefreq: pageKey === 'home' ? 'daily' : 'weekly',
    priority: pageKey === 'home' ? '1.0' : '0.8'
  }));

  return pages;
};
