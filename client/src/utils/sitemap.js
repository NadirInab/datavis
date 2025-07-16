import { SEO_CONFIG } from './seo';

// Generate XML sitemap
export const generateSitemapXML = (additionalUrls = []) => {
  const baseUrls = Object.keys(SEO_CONFIG.pages).map(pageKey => {
    const page = SEO_CONFIG.pages[pageKey];
    return {
      url: `${SEO_CONFIG.site.url}${page.canonical}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: getChangeFrequency(pageKey),
      priority: getPriority(pageKey)
    };
  });

  const allUrls = [...baseUrls, ...additionalUrls];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xmlContent;
};

// Generate robots.txt content
export const generateRobotsTxt = (customRules = []) => {
  const defaultRules = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /private/',
    '',
    `Sitemap: ${SEO_CONFIG.site.url}/sitemap.xml`,
    '',
    '# Crawl-delay for respectful crawling',
    'Crawl-delay: 1'
  ];

  const allRules = [...defaultRules, ...customRules];
  return allRules.join('\n');
};

// Helper functions
const getChangeFrequency = (pageKey) => {
  const frequencies = {
    home: 'daily',
    blog: 'daily',
    features: 'weekly',
    pricing: 'weekly',
    dashboard: 'weekly',
    upload: 'monthly'
  };
  return frequencies[pageKey] || 'monthly';
};

const getPriority = (pageKey) => {
  const priorities = {
    home: '1.0',
    features: '0.9',
    pricing: '0.9',
    dashboard: '0.8',
    blog: '0.7',
    upload: '0.6'
  };
  return priorities[pageKey] || '0.5';
};

// Generate structured data for the entire site
export const generateSiteStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SEO_CONFIG.site.url}/#organization`,
        name: SEO_CONFIG.site.name,
        url: SEO_CONFIG.site.url,
        logo: {
          '@type': 'ImageObject',
          url: `${SEO_CONFIG.site.url}/logo.png`
        },
        description: SEO_CONFIG.site.description,
        foundingDate: '2024',
        sameAs: [
          'https://twitter.com/csvanalytics',
          'https://linkedin.com/company/csvanalytics',
          'https://github.com/csvanalytics'
        ]
      },
      {
        '@type': 'WebSite',
        '@id': `${SEO_CONFIG.site.url}/#website`,
        url: SEO_CONFIG.site.url,
        name: SEO_CONFIG.site.name,
        description: SEO_CONFIG.site.description,
        publisher: {
          '@id': `${SEO_CONFIG.site.url}/#organization`
        },
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SEO_CONFIG.site.url}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          }
        ]
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SEO_CONFIG.site.url}/#software`,
        name: SEO_CONFIG.site.name,
        description: SEO_CONFIG.site.description,
        url: SEO_CONFIG.site.url,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
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
      }
    ]
  };
};

// SEO performance monitoring
export const trackSEOMetrics = () => {
  if (typeof window !== 'undefined') {
    // Track Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
        if (entry.entryType === 'layout-shift') {
          if (!entry.hadRecentInput) {
            console.log('CLS:', entry.value);
          }
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    // Track page load metrics
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      console.log('Page Load Time:', navigation.loadEventEnd - navigation.loadEventStart);
      console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
    });
  }
};

// Generate meta tags for social sharing
export const generateSocialMetaTags = (pageData) => {
  return [
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: pageData.title },
    { property: 'og:description', content: pageData.description },
    { property: 'og:image', content: `${SEO_CONFIG.site.url}${pageData.image || SEO_CONFIG.site.image}` },
    { property: 'og:url', content: `${SEO_CONFIG.site.url}${pageData.canonical}` },
    { property: 'og:site_name', content: SEO_CONFIG.site.name },
    { property: 'og:locale', content: 'en_US' },
    
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: SEO_CONFIG.site.twitterHandle },
    { name: 'twitter:creator', content: SEO_CONFIG.site.twitterHandle },
    { name: 'twitter:title', content: pageData.title },
    { name: 'twitter:description', content: pageData.description },
    { name: 'twitter:image', content: `${SEO_CONFIG.site.url}${pageData.image || SEO_CONFIG.site.image}` },
    
    // LinkedIn
    { property: 'linkedin:owner', content: 'csvanalytics' },
    
    // Pinterest
    { name: 'pinterest-rich-pin', content: 'true' }
  ];
};

// Generate canonical URL
export const generateCanonicalUrl = (path) => {
  const cleanPath = path.replace(/\/+$/, '') || '/';
  return `${SEO_CONFIG.site.url}${cleanPath}`;
};

// Validate SEO implementation
export const validateSEO = (pageData) => {
  const issues = [];
  
  // Title validation
  if (!pageData.title) {
    issues.push({ type: 'error', message: 'Missing page title' });
  } else if (pageData.title.length < 30 || pageData.title.length > 60) {
    issues.push({ type: 'warning', message: `Title length (${pageData.title.length}) should be 30-60 characters` });
  }
  
  // Description validation
  if (!pageData.description) {
    issues.push({ type: 'error', message: 'Missing meta description' });
  } else if (pageData.description.length < 120 || pageData.description.length > 160) {
    issues.push({ type: 'warning', message: `Description length (${pageData.description.length}) should be 120-160 characters` });
  }
  
  // Keywords validation
  if (!pageData.keywords) {
    issues.push({ type: 'warning', message: 'Missing meta keywords' });
  }
  
  // Image validation
  if (!pageData.image) {
    issues.push({ type: 'warning', message: 'Missing social sharing image' });
  }
  
  return issues;
};

export default {
  generateSitemapXML,
  generateRobotsTxt,
  generateSiteStructuredData,
  trackSEOMetrics,
  generateSocialMetaTags,
  generateCanonicalUrl,
  validateSEO
};
