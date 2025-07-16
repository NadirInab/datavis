import React, { useEffect, useState } from 'react';

// Core Web Vitals monitoring component
export const CoreWebVitalsMonitor = () => {
  const [metrics, setMetrics] = useState({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  });

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Track Largest Contentful Paint (LCP)
    const trackLCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }
    };

    // Track First Input Delay (FID)
    const trackFID = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'first-input') {
              const fid = entry.processingStart - entry.startTime;
              setMetrics(prev => ({ ...prev, fid }));
            }
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
      }
    };

    // Track Cumulative Layout Shift (CLS)
    const trackCLS = () => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              setMetrics(prev => ({ ...prev, cls: clsValue }));
            }
          });
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      }
    };

    // Track First Contentful Paint (FCP)
    const trackFCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
          });
        });
        observer.observe({ entryTypes: ['paint'] });
      }
    };

    // Track Time to First Byte (TTFB)
    const trackTTFB = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          setMetrics(prev => ({ ...prev, ttfb }));
        }
      }
    };

    // Initialize tracking
    trackLCP();
    trackFID();
    trackCLS();
    trackFCP();
    trackTTFB();

    // Send metrics to analytics (optional)
    const sendMetrics = () => {
      if (window.gtag) {
        Object.entries(metrics).forEach(([metric, value]) => {
          if (value !== null) {
            window.gtag('event', 'web_vitals', {
              metric_name: metric.toUpperCase(),
              metric_value: Math.round(value),
              custom_parameter: 'core_web_vitals'
            });
          }
        });
      }
    };

    // Send metrics after page load
    window.addEventListener('load', () => {
      setTimeout(sendMetrics, 1000);
    });

  }, []);

  // Development mode display (remove in production)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono z-50">
        <h4 className="font-bold mb-2">Core Web Vitals</h4>
        <div>LCP: {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'Loading...'}</div>
        <div>FID: {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'Waiting...'}</div>
        <div>CLS: {metrics.cls ? metrics.cls.toFixed(3) : 'Calculating...'}</div>
        <div>FCP: {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'Loading...'}</div>
        <div>TTFB: {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'Loading...'}</div>
      </div>
    );
  }

  return null;
};

// SEO validation component
export const SEOValidator = ({ pageData }) => {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const validateSEO = () => {
      const newIssues = [];

      // Check title
      const title = document.title;
      if (!title) {
        newIssues.push({ type: 'error', message: 'Missing page title' });
      } else if (title.length < 30 || title.length > 60) {
        newIssues.push({ 
          type: 'warning', 
          message: `Title length (${title.length}) should be 30-60 characters` 
        });
      }

      // Check meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        newIssues.push({ type: 'error', message: 'Missing meta description' });
      } else {
        const content = metaDescription.getAttribute('content');
        if (content.length < 120 || content.length > 160) {
          newIssues.push({ 
            type: 'warning', 
            message: `Description length (${content.length}) should be 120-160 characters` 
          });
        }
      }

      // Check H1 tags
      const h1Tags = document.querySelectorAll('h1');
      if (h1Tags.length === 0) {
        newIssues.push({ type: 'error', message: 'Missing H1 tag' });
      } else if (h1Tags.length > 1) {
        newIssues.push({ type: 'warning', message: 'Multiple H1 tags found' });
      }

      // Check images without alt text
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      if (imagesWithoutAlt.length > 0) {
        newIssues.push({ 
          type: 'warning', 
          message: `${imagesWithoutAlt.length} images missing alt text` 
        });
      }

      // Check for canonical URL
      const canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        newIssues.push({ type: 'warning', message: 'Missing canonical URL' });
      }

      // Check for Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      
      if (!ogTitle || !ogDescription || !ogImage) {
        newIssues.push({ type: 'warning', message: 'Missing Open Graph tags' });
      }

      setIssues(newIssues);
    };

    // Run validation after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', validateSEO);
    } else {
      validateSEO();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', validateSEO);
    };
  }, [pageData]);

  // Development mode display (remove in production)
  if (process.env.NODE_ENV === 'development' && issues.length > 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-600 bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
        <h4 className="font-bold mb-2">SEO Issues ({issues.length})</h4>
        {issues.map((issue, index) => (
          <div key={index} className={`mb-1 ${issue.type === 'error' ? 'text-red-200' : 'text-yellow-200'}`}>
            <span className="font-semibold">{issue.type.toUpperCase()}:</span> {issue.message}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

// Page speed insights component
export const PageSpeedMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: null,
    domContentLoaded: null,
    firstPaint: null,
    resourceCount: null
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const trackPageSpeed = () => {
      // Track page load metrics
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource');

        setMetrics({
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || null,
          resourceCount: resources.length
        });
      });
    };

    trackPageSpeed();
  }, []);

  // Development mode display (remove in production)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed top-4 right-4 bg-blue-600 bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono z-50">
        <h4 className="font-bold mb-2">Page Speed</h4>
        <div>Load: {metrics.loadTime ? `${Math.round(metrics.loadTime)}ms` : 'Loading...'}</div>
        <div>DOM: {metrics.domContentLoaded ? `${Math.round(metrics.domContentLoaded)}ms` : 'Loading...'}</div>
        <div>FP: {metrics.firstPaint ? `${Math.round(metrics.firstPaint)}ms` : 'Loading...'}</div>
        <div>Resources: {metrics.resourceCount || 'Counting...'}</div>
      </div>
    );
  }

  return null;
};

// Combined SEO monitoring component
export const SEOMonitor = ({ pageData }) => {
  return (
    <>
      <CoreWebVitalsMonitor />
      <SEOValidator pageData={pageData} />
      <PageSpeedMonitor />
    </>
  );
};

export default SEOMonitor;
