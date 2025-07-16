// SEO Checklist and Validation Utilities

export const SEO_CHECKLIST = {
  // Technical SEO Checklist
  technical: [
    {
      id: 'title-tag',
      name: 'Title Tag Optimization',
      description: 'Title should be 30-60 characters and include primary keyword',
      check: () => {
        const title = document.title;
        return {
          passed: title && title.length >= 30 && title.length <= 60,
          value: title?.length || 0,
          message: `Title length: ${title?.length || 0} characters`
        };
      }
    },
    {
      id: 'meta-description',
      name: 'Meta Description',
      description: 'Description should be 120-160 characters and compelling',
      check: () => {
        const meta = document.querySelector('meta[name="description"]');
        const content = meta?.getAttribute('content') || '';
        return {
          passed: content.length >= 120 && content.length <= 160,
          value: content.length,
          message: `Description length: ${content.length} characters`
        };
      }
    },
    {
      id: 'h1-tag',
      name: 'H1 Tag',
      description: 'Page should have exactly one H1 tag with primary keyword',
      check: () => {
        const h1Tags = document.querySelectorAll('h1');
        return {
          passed: h1Tags.length === 1,
          value: h1Tags.length,
          message: `H1 tags found: ${h1Tags.length}`
        };
      }
    },
    {
      id: 'canonical-url',
      name: 'Canonical URL',
      description: 'Page should have a canonical URL defined',
      check: () => {
        const canonical = document.querySelector('link[rel="canonical"]');
        return {
          passed: !!canonical,
          value: canonical?.href || null,
          message: canonical ? 'Canonical URL present' : 'Missing canonical URL'
        };
      }
    },
    {
      id: 'open-graph',
      name: 'Open Graph Tags',
      description: 'Essential OG tags should be present',
      check: () => {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        const ogUrl = document.querySelector('meta[property="og:url"]');
        
        const present = [ogTitle, ogDescription, ogImage, ogUrl].filter(Boolean).length;
        return {
          passed: present === 4,
          value: present,
          message: `${present}/4 essential OG tags present`
        };
      }
    },
    {
      id: 'structured-data',
      name: 'Structured Data',
      description: 'JSON-LD structured data should be present',
      check: () => {
        const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
        return {
          passed: jsonLd.length > 0,
          value: jsonLd.length,
          message: `${jsonLd.length} structured data blocks found`
        };
      }
    },
    {
      id: 'alt-text',
      name: 'Image Alt Text',
      description: 'All images should have descriptive alt text',
      check: () => {
        const images = document.querySelectorAll('img');
        const imagesWithAlt = document.querySelectorAll('img[alt]');
        const missingAlt = images.length - imagesWithAlt.length;
        return {
          passed: missingAlt === 0,
          value: missingAlt,
          message: `${missingAlt} images missing alt text`
        };
      }
    }
  ],

  // Content SEO Checklist
  content: [
    {
      id: 'keyword-density',
      name: 'Keyword Density',
      description: 'Primary keyword should appear 1-3% of content',
      check: (content, keyword) => {
        if (!content || !keyword) return { passed: false, value: 0, message: 'Content or keyword missing' };
        
        const words = content.toLowerCase().split(/\s+/);
        const keywordWords = keyword.toLowerCase().split(/\s+/);
        const keywordCount = words.filter(word => 
          keywordWords.some(kw => word.includes(kw))
        ).length;
        
        const density = (keywordCount / words.length) * 100;
        return {
          passed: density >= 1 && density <= 3,
          value: density,
          message: `Keyword density: ${density.toFixed(2)}%`
        };
      }
    },
    {
      id: 'content-length',
      name: 'Content Length',
      description: 'Page should have substantial content (300+ words)',
      check: (content) => {
        if (!content) return { passed: false, value: 0, message: 'No content provided' };
        
        const words = content.split(/\s+/).length;
        return {
          passed: words >= 300,
          value: words,
          message: `Content length: ${words} words`
        };
      }
    },
    {
      id: 'heading-structure',
      name: 'Heading Structure',
      description: 'Proper heading hierarchy (H1 > H2 > H3)',
      check: () => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let properStructure = true;
        let lastLevel = 0;
        
        headings.forEach(heading => {
          const level = parseInt(heading.tagName.charAt(1));
          if (level > lastLevel + 1) {
            properStructure = false;
          }
          lastLevel = level;
        });
        
        return {
          passed: properStructure,
          value: headings.length,
          message: properStructure ? 'Proper heading hierarchy' : 'Heading hierarchy issues'
        };
      }
    }
  ],

  // Performance Checklist
  performance: [
    {
      id: 'page-speed',
      name: 'Page Load Speed',
      description: 'Page should load in under 3 seconds',
      check: () => {
        if (typeof window === 'undefined') return { passed: false, value: 0, message: 'Not in browser' };
        
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
        
        return {
          passed: loadTime < 3000,
          value: loadTime,
          message: `Load time: ${Math.round(loadTime)}ms`
        };
      }
    },
    {
      id: 'mobile-friendly',
      name: 'Mobile Responsiveness',
      description: 'Page should be mobile-friendly',
      check: () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        const hasViewport = !!viewport;
        const isResponsive = window.innerWidth <= 768 ? true : false; // Basic check
        
        return {
          passed: hasViewport,
          value: hasViewport,
          message: hasViewport ? 'Viewport meta tag present' : 'Missing viewport meta tag'
        };
      }
    }
  ]
};

// Run complete SEO audit
export const runSEOAudit = (content = '', primaryKeyword = '') => {
  const results = {
    technical: [],
    content: [],
    performance: [],
    score: 0,
    totalChecks: 0,
    passedChecks: 0
  };

  // Run technical checks
  SEO_CHECKLIST.technical.forEach(check => {
    const result = check.check();
    results.technical.push({
      ...check,
      result
    });
    results.totalChecks++;
    if (result.passed) results.passedChecks++;
  });

  // Run content checks
  SEO_CHECKLIST.content.forEach(check => {
    const result = check.id === 'keyword-density' 
      ? check.check(content, primaryKeyword)
      : check.check(content);
    results.content.push({
      ...check,
      result
    });
    results.totalChecks++;
    if (result.passed) results.passedChecks++;
  });

  // Run performance checks
  SEO_CHECKLIST.performance.forEach(check => {
    const result = check.check();
    results.performance.push({
      ...check,
      result
    });
    results.totalChecks++;
    if (result.passed) results.passedChecks++;
  });

  // Calculate overall score
  results.score = Math.round((results.passedChecks / results.totalChecks) * 100);

  return results;
};

// Generate SEO recommendations
export const generateSEORecommendations = (auditResults) => {
  const recommendations = [];

  // Check failed items and generate recommendations
  [...auditResults.technical, ...auditResults.content, ...auditResults.performance]
    .filter(item => !item.result.passed)
    .forEach(item => {
      switch (item.id) {
        case 'title-tag':
          recommendations.push({
            priority: 'high',
            category: 'Technical',
            issue: 'Title tag optimization needed',
            solution: 'Optimize title to 30-60 characters with primary keyword',
            impact: 'High - directly affects search rankings'
          });
          break;
        case 'meta-description':
          recommendations.push({
            priority: 'high',
            category: 'Technical',
            issue: 'Meta description needs optimization',
            solution: 'Write compelling 120-160 character description',
            impact: 'Medium - affects click-through rates'
          });
          break;
        case 'keyword-density':
          recommendations.push({
            priority: 'medium',
            category: 'Content',
            issue: 'Keyword density not optimal',
            solution: 'Adjust keyword usage to 1-3% of content',
            impact: 'Medium - affects relevance scoring'
          });
          break;
        case 'page-speed':
          recommendations.push({
            priority: 'high',
            category: 'Performance',
            issue: 'Page load speed too slow',
            solution: 'Optimize images, minify code, use CDN',
            impact: 'High - affects user experience and rankings'
          });
          break;
        default:
          recommendations.push({
            priority: 'medium',
            category: 'General',
            issue: item.name,
            solution: item.description,
            impact: 'Medium - general SEO improvement'
          });
      }
    });

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

export default {
  SEO_CHECKLIST,
  runSEOAudit,
  generateSEORecommendations
};
