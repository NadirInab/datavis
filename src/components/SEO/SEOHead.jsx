import React from 'react';
import { Helmet } from 'react-helmet-async';
import { generateMetaTags, generateStructuredData } from '../../utils/seo';

const SEOHead = ({ 
  pageKey = 'home', 
  customTitle, 
  customDescription, 
  customKeywords,
  customImage,
  customData = {},
  structuredData = null,
  noIndex = false 
}) => {
  // Generate meta tags
  const metaData = generateMetaTags(pageKey, {
    title: customTitle,
    description: customDescription,
    keywords: customKeywords,
    image: customImage,
    ...customData
  });

  // Generate structured data
  const schema = structuredData || generateStructuredData(pageKey, customData);

  return (
    <Helmet>
      {/* Title */}
      <title>{metaData.title}</title>

      {/* Meta tags */}
      {metaData.meta.map((tag, index) => {
        if (tag.name) {
          return <meta key={index} name={tag.name} content={tag.content} />;
        }
        if (tag.property) {
          return <meta key={index} property={tag.property} content={tag.content} />;
        }
        return null;
      })}

      {/* No-index for private pages */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Link tags */}
      {metaData.link.map((link, index) => (
        <link key={index} {...link} />
      ))}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>

      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
    </Helmet>
  );
};

export default SEOHead;
