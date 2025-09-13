import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedDate: string;
  readTime: number;
  category: string;
  tags: string[];
  featuredImage?: string;
}

interface BlogGridProps {
  posts: BlogPost[];
  title?: string;
  description?: string;
  category?: string;
  tag?: string;
}

export function BlogGrid({ 
  posts, 
  title = "Fitness Business Blog", 
  description = "Expert insights, best practices, and strategies for gym owners and fitness professionals.",
  category,
  tag 
}: BlogGridProps) {
  const pageTitle = category ? `${category} Articles` : tag ? `Posts tagged "${tag}"` : title;
  const pageDescription = category 
    ? `Expert articles about ${category.toLowerCase()} for fitness professionals.`
    : tag 
    ? `All articles tagged with ${tag}.`
    : description;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": pageTitle,
    "description": pageDescription,
    "url": window.location.href,
    "publisher": {
      "@type": "Organization",
      "name": "Rep Club",
      "logo": "https://repclub.app/logo.png"
    },
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "url": `${window.location.origin}/blog/${post.slug}`,
      "datePublished": new Date(post.publishedDate).toISOString(),
      "author": {
        "@type": "Organization",
        "name": "Rep Club"
      },
      "image": post.featuredImage
    }))
  };

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords="fitness blog, gym management tips, fitness business advice, workout tips, member retention"
        structuredData={structuredData}
      />
      
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{pageTitle}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {pageDescription}
          </p>
        </header>

        {/* Category/Tag Filter Info */}
        {(category || tag) && (
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="text-sm">
              {category ? `Category: ${category}` : `Tag: ${tag}`}
            </Badge>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.slug}>
              <Card className="gym-card h-full hover:shadow-elevation-3 transition-all duration-300">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Featured Image */}
                  {post.featuredImage && (
                    <Link to={`/blog/${post.slug}`} className="block">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                        loading="lazy"
                      />
                    </Link>
                  )}
                  
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Category Badge */}
                    <Link to={`/blog/category/${post.category.toLowerCase()}`} className="mb-3 w-fit block">
                      <Badge variant="outline" className="hover:bg-accent transition-colors">
                        {post.category}
                      </Badge>
                    </Link>

                    {/* Title & Excerpt */}
                    <CardHeader className="p-0 mb-4 flex-1">
                      <CardTitle className="text-xl leading-tight mb-2">
                        <Link 
                          to={`/blog/${post.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                      </CardTitle>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {post.excerpt}
                      </p>
                    </CardHeader>

                    {/* Meta Information */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <time dateTime={new Date(post.publishedDate).toISOString()}>
                            {new Date(post.publishedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </time>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="flex justify-end">
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Read More
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-4">
                      {post.tags.slice(0, 3).map(tag => (
                        <Link key={tag} to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Badge variant="outline" className="text-xs hover:bg-accent transition-colors">
                            {tag}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </article>
          ))}
        </div>

        {/* No Posts Message */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">No posts found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find any posts matching your criteria.
            </p>
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to all posts
            </Link>
          </div>
        )}
      </div>
    </>
  );
}