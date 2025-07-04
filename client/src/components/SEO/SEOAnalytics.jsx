import React, { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Google Analytics 4 configuration
export const initGA4 = (measurementId) => {
  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true
  });

  // Track Core Web Vitals
  getCLS((metric) => {
    gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: 'CLS',
      value: Math.round(metric.value * 1000),
      non_interaction: true
    });
  });

  getFID((metric) => {
    gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: 'FID',
      value: Math.round(metric.value),
      non_interaction: true
    });
  });

  getFCP((metric) => {
    gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: 'FCP',
      value: Math.round(metric.value),
      non_interaction: true
    });
  });

  getLCP((metric) => {
    gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: 'LCP',
      value: Math.round(metric.value),
      non_interaction: true
    });
  });

  getTTFB((metric) => {
    gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: 'TTFB',
      value: Math.round(metric.value),
      non_interaction: true
    });
  });
};

// Track page views
export const trackPageView = (path, title) => {
  if (window.gtag) {
    window.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title
    });
  }
};

// Track events
export const trackEvent = (action, category, label, value) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Track conversions
export const trackConversion = (conversionType, value = null) => {
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      event_category: 'Conversions',
      event_label: conversionType,
      value: value
    });
  }
};

// Track file uploads
export const trackFileUpload = (fileType, fileSize) => {
  trackEvent('file_upload', 'User Engagement', fileType, fileSize);
};

// Track dashboard creation
export const trackDashboardCreation = (chartType) => {
  trackEvent('dashboard_created', 'User Engagement', chartType);
};

// Track subscription events
export const trackSubscription = (planType, action) => {
  trackEvent(action, 'Subscription', planType);
  if (action === 'purchase') {
    trackConversion('subscription_purchase', planType);
  }
};

// SEO Analytics Component
const SEOAnalytics = ({ measurementId }) => {
  useEffect(() => {
    if (measurementId && typeof window !== 'undefined') {
      initGA4(measurementId);
    }
  }, [measurementId]);

  return null; // This component doesn't render anything
};

// Hook for tracking page views in React Router
export const usePageTracking = () => {
  const location = window.location;
  
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);
};

// Hook for tracking user interactions
export const useInteractionTracking = () => {
  useEffect(() => {
    // Track scroll depth
    let maxScroll = 0;
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
          trackEvent('scroll_depth', 'User Engagement', `${maxScroll}%`);
        }
      }
    };

    // Track time on page
    const startTime = Date.now();
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      trackEvent('time_on_page', 'User Engagement', window.location.pathname, timeOnPage);
    };

    // Track clicks on external links
    const handleClick = (event) => {
      const link = event.target.closest('a');
      if (link && link.hostname !== window.location.hostname) {
        trackEvent('external_link_click', 'User Engagement', link.href);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
    };
  }, []);
};

// Performance monitoring component
export const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const metrics = {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          load: perfData.loadEventEnd - perfData.loadEventStart
        };

        // Send performance metrics to analytics
        Object.entries(metrics).forEach(([metric, value]) => {
          trackEvent('performance_timing', 'Performance', metric, Math.round(value));
        });
      }, 0);
    });

    // Monitor resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        trackEvent('resource_error', 'Errors', event.target.src || event.target.href);
      }
    });

    // Monitor JavaScript errors
    window.addEventListener('error', (event) => {
      trackEvent('javascript_error', 'Errors', event.message);
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      trackEvent('promise_rejection', 'Errors', event.reason);
    });
  }, []);

  return null;
};

// Search Console integration helper
export const submitToSearchConsole = async (urls) => {
  // This would typically be done server-side
  // Here's the structure for reference
  const indexingRequest = {
    url: urls,
    type: 'URL_UPDATED'
  };
  
  console.log('Submit to Search Console:', indexingRequest);
  // Implementation would require Google Search Console API
};

// Schema.org structured data generator
export const generateBlogPostSchema = (post) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    author: {
      '@type': 'Person',
      name: post.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'CSV Analytics Studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://csvanalytics.studio/logo.png'
      }
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://csvanalytics.studio/blog/${post.id}`
    }
  };
};

// FAQ schema generator
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

export default SEOAnalytics;
