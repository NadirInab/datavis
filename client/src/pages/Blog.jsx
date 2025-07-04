import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';
import Button, { Icons } from '../components/ui/Button';
import Card from '../components/ui/Card';

const Blog = () => {
  const blogPosts = [
    {
      id: 'csv-data-analysis-guide',
      title: 'Complete Guide to CSV Data Analysis: From Spreadsheets to Business Insights',
      excerpt: 'Learn how to transform raw CSV data into actionable business intelligence. This comprehensive guide covers data cleaning, analysis techniques, and visualization best practices.',
      author: 'Data Analytics Team',
      date: '2025-01-03',
      readTime: '12 min read',
      category: 'Data Analysis',
      image: '/images/blog/csv-analysis-guide.jpg',
      tags: ['CSV Analysis', 'Data Processing', 'Business Intelligence'],
      featured: true
    },
    {
      id: 'business-intelligence-dashboard-best-practices',
      title: 'Business Intelligence Dashboard Best Practices: Design for Impact',
      excerpt: 'Discover the key principles for creating effective BI dashboards that drive decision-making. Learn about layout, color theory, and data storytelling.',
      author: 'UX Design Team',
      date: '2025-01-02',
      readTime: '8 min read',
      category: 'Dashboard Design',
      image: '/images/blog/dashboard-best-practices.jpg',
      tags: ['Dashboard Design', 'Business Intelligence', 'UX Design']
    },
    {
      id: 'excel-vs-csv-analytics-tools',
      title: 'Excel vs Modern CSV Analytics Tools: Which Should Your Business Choose?',
      excerpt: 'Compare traditional Excel workflows with modern CSV analytics platforms. Understand the benefits, limitations, and when to make the switch.',
      author: 'Business Strategy Team',
      date: '2025-01-01',
      readTime: '10 min read',
      category: 'Tool Comparison',
      image: '/images/blog/excel-vs-csv-tools.jpg',
      tags: ['Excel Alternative', 'Tool Comparison', 'Business Strategy']
    },
    {
      id: 'data-visualization-techniques',
      title: 'Advanced Data Visualization Techniques for Business Analytics',
      excerpt: 'Master the art of data visualization with advanced techniques. Learn when to use different chart types and how to tell compelling data stories.',
      author: 'Data Visualization Team',
      date: '2024-12-30',
      readTime: '15 min read',
      category: 'Visualization',
      image: '/images/blog/data-visualization-techniques.jpg',
      tags: ['Data Visualization', 'Chart Types', 'Analytics']
    },
    {
      id: 'small-business-data-analysis',
      title: 'Small Business Data Analysis: Getting Started with CSV Analytics',
      excerpt: 'A beginner-friendly guide to data analysis for small businesses. Learn how to use CSV analytics to improve operations and drive growth.',
      author: 'Small Business Team',
      date: '2024-12-28',
      readTime: '7 min read',
      category: 'Small Business',
      image: '/images/blog/small-business-analytics.jpg',
      tags: ['Small Business', 'Getting Started', 'Business Growth']
    },
    {
      id: 'csv-file-formats-guide',
      title: 'Understanding CSV File Formats: A Technical Deep Dive',
      excerpt: 'Everything you need to know about CSV file formats, encoding, delimiters, and best practices for data integrity.',
      author: 'Technical Team',
      date: '2024-12-25',
      readTime: '6 min read',
      category: 'Technical',
      image: '/images/blog/csv-formats-guide.jpg',
      tags: ['CSV Format', 'Technical Guide', 'Data Integrity']
    }
  ];

  const categories = [
    'All Posts',
    'Data Analysis',
    'Dashboard Design',
    'Tool Comparison',
    'Visualization',
    'Small Business',
    'Technical'
  ];

  const [selectedCategory, setSelectedCategory] = React.useState('All Posts');

  const filteredPosts = selectedCategory === 'All Posts' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPost = blogPosts.find(post => post.featured);

  return (
    <>
      <SEOHead
        pageKey="blog"
        customTitle="Data Analytics Blog - CSV Tips, Visualization Guides & Business Intelligence Insights"
        customDescription="Expert insights on data analysis, CSV processing tips, visualization best practices, and business intelligence strategies. Learn from data professionals and improve your analytics skills."
        customKeywords="data analytics blog, csv tips, visualization guides, business intelligence insights, data analysis tutorials, spreadsheet analysis, dashboard design"
      />

      <div className="min-h-screen bg-[#FAFFCA]">
        {/* Header */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#5A827E] mb-6">
              Data Analytics & Business Intelligence Blog
            </h1>
            <p className="text-xl text-[#5A827E]/70 max-w-3xl mx-auto">
              Expert insights, tutorials, and best practices for CSV analytics, 
              data visualization, and business intelligence. Learn from industry professionals.
            </p>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-[#5A827E] mb-8">Featured Article</h2>
              <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img 
                      src={featuredPost.image} 
                      alt={featuredPost.title}
                      className="w-full h-64 md:h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/blog/default-blog-image.jpg';
                      }}
                    />
                  </div>
                  <div className="md:w-1/2 p-8">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="bg-[#B9D4AA] text-[#5A827E] px-3 py-1 rounded-full text-sm font-medium">
                        {featuredPost.category}
                      </span>
                      <span className="text-[#5A827E]/60 text-sm">{featuredPost.readTime}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#5A827E] mb-4">
                      <Link 
                        to={`/blog/${featuredPost.id}`}
                        className="hover:text-[#84AE92] transition-colors"
                      >
                        {featuredPost.title}
                      </Link>
                    </h3>
                    <p className="text-[#5A827E]/70 mb-6">{featuredPost.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-[#5A827E]/60">By {featuredPost.author}</span>
                        <span className="text-[#5A827E]/40">•</span>
                        <span className="text-sm text-[#5A827E]/60">{featuredPost.date}</span>
                      </div>
                      <Button
                        as={Link}
                        to={`/blog/${featuredPost.id}`}
                        variant="outline"
                        icon={Icons.ArrowRight}
                        iconPosition="right"
                      >
                        Read More
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Category Filter */}
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-[#5A827E] text-white'
                      : 'bg-white text-[#5A827E] hover:bg-[#84AE92]/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-8 px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.filter(post => !post.featured).map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = '/images/blog/default-blog-image.jpg';
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="bg-[#B9D4AA]/30 text-[#5A827E] px-2 py-1 rounded text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-[#5A827E]/60 text-xs">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#5A827E] mb-3">
                      <Link 
                        to={`/blog/${post.id}`}
                        className="hover:text-[#84AE92] transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-[#5A827E]/70 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-[#5A827E]/60">
                      <span>By {post.author}</span>
                      <span>{post.date}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="bg-[#FAFFCA] text-[#5A827E] px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 px-4 bg-[#5A827E] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Stay Updated with Data Analytics Insights
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Get the latest tips, tutorials, and best practices delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-[#5A827E] focus:outline-none focus:ring-2 focus:ring-[#84AE92]"
              />
              <Button
                variant="secondary"
                icon={Icons.ArrowRight}
                iconPosition="right"
                className="px-6 py-3"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-sm opacity-70 mt-4">
              No spam. Unsubscribe anytime. Read our privacy policy.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default Blog;
