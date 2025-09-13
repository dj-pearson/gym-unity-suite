import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { Footer } from '@/components/layout/Footer';
import { Calendar, Clock, ArrowLeft, Share2, BookmarkPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPostProps {
  title: string;
  content: string;
  excerpt: string;
  publishedDate: string;
  readTime: number;
  category: string;
  tags: string[];
  featuredImage?: string;
  relatedPosts?: Array<{
    slug: string;
    title: string;
    excerpt: string;
    featuredImage?: string;
  }>;
}

export function BlogPost({
  title,
  content,
  excerpt,
  publishedDate,
  readTime,
  category,
  tags,
  featuredImage,
  relatedPosts = []
}: BlogPostProps) {
  const publishedTime = new Date(publishedDate).toISOString();
  const keywords = `${tags.join(', ')}, fitness management, gym best practices, fitness business, ${category.toLowerCase()}`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": excerpt,
    "image": featuredImage,
    "author": {
      "@type": "Organization",
      "name": "Rep Club"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Rep Club",
      "logo": {
        "@type": "ImageObject",
        "url": "https://repclub.app/logo.png"
      }
    },
    "datePublished": publishedTime,
    "dateModified": publishedTime,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    },
    "articleSection": category,
    "keywords": keywords,
    "wordCount": content.split(' ').length
  };

  return (
    <>
      <SEOHead
        title={title}
        description={excerpt}
        keywords={keywords}
        type="article"
        publishedTime={publishedTime}
        modifiedTime={publishedTime}
        category={category}
        tags={tags}
        image={featuredImage}
        structuredData={structuredData}
      />
      
      {/* Page Header */}
      <header className="bg-gradient-primary text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center justify-center space-x-2 text-sm text-white/80">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li>/</li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li>/</li>
              <li><Link to={`/blog/category/${category.toLowerCase()}`} className="hover:text-white transition-colors">{category}</Link></li>
            </ol>
          </nav>
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">{category}</Badge>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
            {excerpt}
          </p>
        </div>
      </header>
      
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        {/* Article Meta */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-border py-4 mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <time dateTime={publishedTime}>
              {new Date(publishedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{readTime} min read</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>

        {/* Featured Image */}
        {featuredImage && (
          <figure className="mb-8">
            <img
              src={featuredImage}
              alt={title}
              className="w-full rounded-lg shadow-elevation-2"
              loading="lazy"
            />
          </figure>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {/* Tags */}
        <section className="mb-12" aria-labelledby="tags-heading">
          <h3 id="tags-heading" className="text-lg font-semibold mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Link key={tag} to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                <Badge variant="outline" className="hover:bg-accent transition-colors">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </section>


        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-posts-heading">
            <h3 id="related-posts-heading" className="text-2xl font-bold mb-6">Related Articles</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map(post => (
                <Card key={post.slug} className="gym-card">
                  <CardContent className="p-0">
                    <Link to={`/blog/${post.slug}`}>
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                          loading="lazy"
                        />
                      )}
                      <div className="p-6">
                        <h4 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </article>
      
      <Footer />
    </>
  );
}