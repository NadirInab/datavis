import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SEO Configuration (simplified for Node.js)
const SEO_CONFIG = {
  site: {
    url: 'https://csvanalytics.studio', // Update with your actual domain
  },
  pages: {
    home: { canonical: '/', priority: '1.0', changefreq: 'daily' },
    features: { canonical: '/features', priority: '0.9', changefreq: 'weekly' },
    pricing: { canonical: '/pricing', priority: '0.9', changefreq: 'weekly' },
    dashboard: { canonical: '/app', priority: '0.8', changefreq: 'weekly' },
    upload: { canonical: '/upload', priority: '0.6', changefreq: 'monthly' },
    blog: { canonical: '/blog', priority: '0.7', changefreq: 'daily' },
    about: { canonical: '/about', priority: '0.5', changefreq: 'monthly' },
    contact: { canonical: '/contact', priority: '0.5', changefreq: 'monthly' },
    privacy: { canonical: '/privacy', priority: '0.3', changefreq: 'yearly' },
    terms: { canonical: '/terms', priority: '0.3', changefreq: 'yearly' }
  }
};

// Generate sitemap XML
const generateSitemapXML = () => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urls = Object.keys(SEO_CONFIG.pages).map(pageKey => {
    const page = SEO_CONFIG.pages[pageKey];
    return `  <url>
    <loc>${SEO_CONFIG.site.url}${page.canonical}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
};

// Generate robots.txt
const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# Allow important pages
Allow: /
Allow: /features
Allow: /pricing
Allow: /app
Allow: /blog

# Sitemap location
Sitemap: ${SEO_CONFIG.site.url}/sitemap.xml

# Crawl delay for respectful crawling
Crawl-delay: 1

# Google-specific directives
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Bing-specific directives
User-agent: Bingbot
Allow: /
Crawl-delay: 1`;
};

// Generate and save files
const generateSEOFiles = () => {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Generate sitemap.xml
  const sitemapContent = generateSitemapXML();
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);
  console.log('✅ Generated sitemap.xml');

  // Generate robots.txt
  const robotsContent = generateRobotsTxt();
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent);
  console.log('✅ Generated robots.txt');

  // Generate manifest.json for PWA
  const manifestContent = {
    "name": "CSV Analytics Studio",
    "short_name": "CSV Analytics",
    "description": "Professional data visualization and business intelligence platform",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#5A827E",
    "theme_color": "#5A827E",
    "icons": [
      {
        "src": "/favicon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/favicon-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  };
  
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifestContent, null, 2));
  console.log('✅ Generated site.webmanifest');

  console.log('\n🎉 All SEO files generated successfully!');
  console.log('📁 Files created in:', publicDir);
  console.log('   - sitemap.xml');
  console.log('   - robots.txt');
  console.log('   - site.webmanifest');
};

// Run the generator
generateSEOFiles();

export {
  generateSitemapXML,
  generateRobotsTxt,
  generateSEOFiles
};
