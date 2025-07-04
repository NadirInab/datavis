import React, { Suspense, lazy } from 'react';

// Lazy loading component for better performance
const LazyImage = ({ src, alt, className, ...props }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          {...props}
        />
      )}
      {!isLoaded && isInView && (
        <div className={`bg-gray-200 animate-pulse ${className}`} />
      )}
    </div>
  );
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.as = 'style';
  criticalCSS.href = '/css/critical.css';
  document.head.appendChild(criticalCSS);

  // Preload critical fonts
  const font = document.createElement('link');
  font.rel = 'preload';
  font.as = 'font';
  font.type = 'font/woff2';
  font.href = '/fonts/inter-var.woff2';
  font.crossOrigin = 'anonymous';
  document.head.appendChild(font);

  // Preconnect to external domains
  const preconnects = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://www.google-analytics.com'
  ];

  preconnects.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    if (domain.includes('gstatic')) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
};

// Web Vitals monitoring
export const initWebVitals = () => {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
};

// Service Worker registration for caching
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Critical CSS inlining
export const inlineCriticalCSS = () => {
  const criticalCSS = `
    /* Critical CSS for above-the-fold content */
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #FAFFCA;
    }
    
    .hero-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .btn-primary {
      background-color: #5A827E;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .btn-primary:hover {
      background-color: #84AE92;
    }
  `;

  const style = document.createElement('style');
  style.innerHTML = criticalCSS;
  document.head.appendChild(style);
};

// Resource hints component
export const ResourceHints = () => (
  <>
    {/* DNS prefetch for external domains */}
    <link rel="dns-prefetch" href="//fonts.googleapis.com" />
    <link rel="dns-prefetch" href="//www.google-analytics.com" />
    <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
    
    {/* Preconnect to critical external domains */}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    
    {/* Preload critical resources */}
    <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    <link rel="preload" href="/images/hero-bg.webp" as="image" />
    
    {/* Module preload for critical JavaScript */}
    <link rel="modulepreload" href="/src/main.jsx" />
  </>
);

// Image optimization component
export const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  priority = false,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = React.useState('');
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Generate responsive image sources
    const generateSrcSet = (baseSrc) => {
      const ext = baseSrc.split('.').pop();
      const baseName = baseSrc.replace(`.${ext}`, '');
      
      return [
        `${baseName}-400w.webp 400w`,
        `${baseName}-800w.webp 800w`,
        `${baseName}-1200w.webp 1200w`,
        `${baseName}-1600w.webp 1600w`
      ].join(', ');
    };

    setImageSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    // Fallback to original format if WebP fails
    const fallbackSrc = src.replace('.webp', '.jpg');
    setImageSrc(fallbackSrc);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </div>
  );
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  React.useEffect(() => {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'page_load_time', {
            event_category: 'Performance',
            event_label: window.location.pathname,
            value: Math.round(loadTime)
          });
        }
      }, 0);
    });

    // Monitor Core Web Vitals
    if (typeof window !== 'undefined') {
      initWebVitals();
    }
  }, []);
};

// Bundle splitting helper
export const loadComponentAsync = (importFunc) => {
  return lazy(() => 
    importFunc().then(module => ({
      default: module.default || module
    }))
  );
};

// Critical resource loader
export const CriticalResourceLoader = ({ children }) => {
  React.useEffect(() => {
    preloadCriticalResources();
    inlineCriticalCSS();
    registerServiceWorker();
  }, []);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#5A827E]"></div>
      </div>
    }>
      {children}
    </Suspense>
  );
};

export { LazyImage };
export default PerformanceOptimizer;
